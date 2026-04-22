import modal
import os
import csv
import io
import json
import re
import base64
import traceback
from datetime import datetime, date as date_type

app = modal.App("finance-copilot-processor")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi[standard]",
        "supabase==2.10.0",
        "httpx==0.27.2",
        "pdfplumber==0.11.4",
        "openpyxl==3.1.5",
    )
)

# ── Column aliases ───────────────────────────────────────────────────────────

DATE_ALIASES = {"date", "transaction date", "txn date", "value date", "posting date"}
DESC_ALIASES = {"description", "narration", "particulars", "details", "remarks", "transaction details"}
DEBIT_ALIASES = {"dr", "debit", "withdrawal", "withdrawals", "debit amount", "dr amount"}
CREDIT_ALIASES = {"cr", "credit", "deposit", "deposits", "credit amount", "cr amount"}
AMOUNT_ALIASES = {"amount", "transaction amount", "net amount"}
MERCHANT_ALIASES = {"merchant", "payee", "beneficiary", "vendor"}


def normalize_header(h: str) -> str:
    return h.strip().lower()


def find_col(headers: list[str], aliases: set[str]) -> str | None:
    for h in headers:
        if normalize_header(h) in aliases:
            return h
    return None


def parse_amount(val: str) -> float:
    """Strip currency symbols, commas; return float."""
    val = re.sub(r"[₹$€£,\s]", "", str(val))
    try:
        return float(val)
    except ValueError:
        return 0.0


def normalize_rows(rows: list[dict]) -> list[dict]:
    """Convert raw CSV/Excel rows into {date, amount, merchant, raw_description}."""
    if not rows:
        return []
    headers = list(rows[0].keys())
    date_col = find_col(headers, DATE_ALIASES)
    desc_col = find_col(headers, DESC_ALIASES)
    merchant_col = find_col(headers, MERCHANT_ALIASES)
    debit_col = find_col(headers, DEBIT_ALIASES)
    credit_col = find_col(headers, CREDIT_ALIASES)
    amount_col = find_col(headers, AMOUNT_ALIASES)

    out = []
    for row in rows:
        raw_desc = str(row.get(desc_col, "") or "") if desc_col else ""
        merchant_raw = str(row.get(merchant_col, "") or "") if merchant_col else ""
        merchant = merchant_raw or raw_desc[:60]

        if debit_col and credit_col:
            debit_val = parse_amount(str(row.get(debit_col, "") or "0"))
            credit_val = parse_amount(str(row.get(credit_col, "") or "0"))
            if debit_val > 0:
                amount = -debit_val
            elif credit_val > 0:
                amount = credit_val
            else:
                continue
        elif amount_col:
            amount = parse_amount(str(row.get(amount_col, "0") or "0"))
        else:
            continue

        raw_date = row.get(date_col) if date_col else None
        parsed_date = parse_date(raw_date)
        if not parsed_date:
            continue

        out.append({
            "date": parsed_date,
            "amount": round(amount, 2),
            "merchant": (merchant or "").strip() or "Unknown",
            "raw_description": (raw_desc or "").strip(),
        })
    return out


DATE_FORMATS = [
    "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y",
    "%d %b %Y", "%d-%b-%Y", "%d/%b/%Y",
]


def parse_date(val) -> str | None:
    # openpyxl returns actual datetime/date objects for date cells
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, date_type):
        return val.strftime("%Y-%m-%d")
    val = str(val or "").strip()
    if not val:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(val, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


# ── Parsers ──────────────────────────────────────────────────────────────────

def parse_csv(file_bytes: bytes) -> list[dict]:
    # utf-8-sig strips the BOM that many bank exports prepend
    text = file_bytes.decode("utf-8-sig", errors="replace")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel  # fallback to comma
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    return normalize_rows(list(reader))


def parse_excel(file_bytes: bytes) -> list[dict]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h or "").strip() for h in rows[0]]
    dicts = [dict(zip(headers, row)) for row in rows[1:]]
    return normalize_rows(dicts)


def parse_pdf(file_bytes: bytes) -> list[dict]:
    import pdfplumber

    DATE_RE = re.compile(r"\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{2}[/-]\w{3}[/-]\d{4})\b")
    AMOUNT_RE = re.compile(r"([\d,]+\.\d{2})")

    out = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.splitlines():
                date_m = DATE_RE.search(line)
                amounts = AMOUNT_RE.findall(line)
                if not date_m or not amounts:
                    continue
                date_str = parse_date(date_m.group(1))
                if not date_str:
                    continue
                amount_val = parse_amount(amounts[-1])
                description = line[date_m.end():].strip()[:120]
                # Heuristic: if "Dr" or "Debit" in line → negative
                is_debit = bool(re.search(r"\bDr\b|\bDebit\b|\bWithdrawal\b", line, re.IGNORECASE))
                amount = -amount_val if is_debit else amount_val
                out.append({
                    "date": date_str,
                    "amount": round(amount, 2),
                    "merchant": description[:60] or "Unknown",
                    "raw_description": description,
                })
    return out


# ── LLM Categorisation ───────────────────────────────────────────────────────

CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"]
SYSTEM_PROMPT = (
    f"Categorise each transaction. Return ONLY a JSON array: "
    f'[{{"id": "<id>", "category": "<cat>"}}]. '
    f"Categories: {', '.join(CATEGORIES)}."
)


def categorise_batch(batch: list[dict], llm_model: str, llm_base_url: str, api_key: str) -> dict[str, str]:
    items = [{"id": str(t["_idx"]), "description": t["raw_description"], "amount": t["amount"]} for t in batch]
    payload = {
        "model": llm_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(items)},
        ],
        "temperature": 0,
    }
    import httpx
    resp = httpx.post(
        f"{llm_base_url}/chat/completions",
        json=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        timeout=60,
    )
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"].strip()
    # Strip markdown fences if present
    content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()
    try:
        result = json.loads(content)
        return {item["id"]: item["category"] for item in result if "id" in item and "category" in item}
    except json.JSONDecodeError:
        return {}


def upsert_monthly_summaries(supabase, user_id: str, debits: list[dict]) -> None:
    from collections import defaultdict
    monthly: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for t in debits:
        month = t["date"][:7] + "-01"
        cat = t.get("category") or "Other"
        monthly[month][cat] += abs(t["amount"])

    for month, cats in monthly.items():
        for cat, total in cats.items():
            supabase.table("monthly_summaries").upsert(
                {
                    "user_id": user_id,
                    "month": month,
                    "category": cat,
                    "total_amount": round(total, 2),
                },
                on_conflict="user_id,month,category",
            ).execute()


# ── Modal endpoint ────────────────────────────────────────────────────────────

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("finance-secrets")],
    timeout=300,
)
@modal.fastapi_endpoint(method="POST")
def file_processor(item: dict) -> dict:
    try:
        return _process(item)
    except Exception:
        tb = traceback.format_exc()
        print("FILE_PROCESSOR_ERROR:\n", tb)
        # Surface the real error so it appears in the Next.js server console
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=tb)


def _process(item: dict) -> dict:
    user_id: str = item["user_id"]
    filename: str = item["filename"]
    file_bytes: bytes = base64.b64decode(item["file_bytes"])

    llm_model = os.environ.get("LLM_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")
    llm_base_url = os.environ.get("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    api_key = os.environ["OPENROUTER_API_KEY"]

    # Parse
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "csv":
        transactions = parse_csv(file_bytes)
    elif ext in ("xlsx", "xls"):
        transactions = parse_excel(file_bytes)
    elif ext == "pdf":
        transactions = parse_pdf(file_bytes)
    else:
        return {"error": f"Unsupported file type: {ext}"}

    if not transactions:
        return {"error": "No transactions parsed from file"}

    debits = [t for t in transactions if t["amount"] < 0]
    credits = [t for t in transactions if t["amount"] >= 0]
    # Categorise debits in batches of 20
    for idx, t in enumerate(debits):
        t["_idx"] = idx
    cat_map: dict[str, str] = {}
    for i in range(0, len(debits), 20):
        batch = debits[i : i + 20]
        try:
            batch_cats = categorise_batch(batch, llm_model, llm_base_url, api_key)
            cat_map.update(batch_cats)
        except Exception:
            try:
                batch_cats = categorise_batch(batch, llm_model, llm_base_url, api_key)
                cat_map.update(batch_cats)
            except Exception:
                pass

    for t in debits:
        t["category"] = cat_map.get(str(t["_idx"]), "Other")
        del t["_idx"]
    for t in credits:
        t["category"] = None

    # Write to Supabase
    from supabase import create_client
    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    rows = [
        {
            "user_id": user_id,
            "date": t["date"],
            "amount": t["amount"],
            "merchant": t["merchant"],
            "raw_description": t["raw_description"],
            "category": t.get("category"),
            "is_anomaly": False,
        }
        for t in debits + credits
    ]
    supabase.table("transactions").insert(rows).execute()
    upsert_monthly_summaries(supabase, user_id, debits)

    cat_counts: dict[str, int] = {}
    for t in debits:
        cat = t.get("category") or "Other"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    return {"count": len(rows), "categories": cat_counts}
