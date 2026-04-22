"""
Daily news ingestion cron — runs at 01:00 UTC (06:30 IST).
Sources: Marketaux, NewsData.io, Yahoo Finance RSS.
Writes headlines to news_cache and inserts into LightRAG.
"""

import modal
import os
import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict

app = modal.App("finance-copilot-news")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "supabase==2.10.0",
        "httpx==0.27.2",
        "lightrag-hku==1.3.5",
        "feedparser==6.0.11",
    )
)

lightrag_vol = modal.Volume.from_name("lightrag-store", create_if_missing=True)

LIGHTRAG_DIR = "/lightrag-store/p10_finance"

# ── Adaptive Quota Manager ────────────────────────────────────────────────────

class AdaptiveQuotaManager:
    TIERS = [
        ("ticker", 7, float("inf")),    # Tier 1: tickers active ≤7d — never drop
        ("ticker", 30, 80),             # Tier 2: tickers semi-active ≤30d
        ("merchant", 7, 120),           # Tier 3: merchants active ≤7d
        ("merchant", 30, 160),          # Tier 4: merchants semi-active
        ("search", 30, 180),            # Tier 5: nexus search terms
    ]

    def compute_budget(self, supabase, marketaux_daily: int, newsdata_daily: int) -> dict:
        now = datetime.now(timezone.utc)

        # Score contexts
        contexts: list[dict] = []

        # Tickers
        tickers_q = supabase.table("portfolio_tickers").select("user_id, ticker").execute()
        for row in (tickers_q.data or []):
            contexts.append({"type": "ticker", "value": row["ticker"], "user_id": row["user_id"]})

        # Top merchants per user (by transaction volume in last 90d)
        txn_q = (
            supabase.table("transactions")
            .select("user_id, merchant, amount")
            .lt("amount", 0)
            .gte("date", (now - timedelta(days=90)).strftime("%Y-%m-%d"))
            .execute()
        )
        user_merchant_spend: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        for t in (txn_q.data or []):
            user_merchant_spend[t["user_id"]][t["merchant"]] += abs(t["amount"])

        for user_id, merchants in user_merchant_spend.items():
            top5 = sorted(merchants, key=merchants.get, reverse=True)[:5]
            for m in top5:
                contexts.append({"type": "merchant", "value": m, "user_id": user_id})

        # Recent nexus queries
        queries_q = (
            supabase.table("nexus_queries")
            .select("user_id, query, created_at")
            .gte("created_at", (now - timedelta(days=30)).isoformat())
            .execute()
        )
        for q in (queries_q.data or []):
            contexts.append({"type": "search", "value": q["query"], "user_id": q["user_id"]})

        # Deduplicate (same context_value → one API call, multi-user write)
        unique_contexts: dict[str, dict] = {}
        for ctx in contexts:
            key = f"{ctx['type']}:{ctx['value']}"
            if key not in unique_contexts:
                unique_contexts[key] = {**ctx, "user_ids": [ctx["user_id"]]}
            else:
                if ctx["user_id"] not in unique_contexts[key]["user_ids"]:
                    unique_contexts[key]["user_ids"].append(ctx["user_id"])

        # Apply tier drop logic
        total = len(unique_contexts)
        allowed_keys = set()
        for ctx_type, max_age_days, drop_threshold in self.TIERS:
            if total <= drop_threshold:
                for k, v in unique_contexts.items():
                    if v["type"] == ctx_type:
                        allowed_keys.add(k)

        allowed = {k: v for k, v in unique_contexts.items() if k in allowed_keys}

        # Reserve 15%
        marketaux_budget = int(marketaux_daily * 0.85)
        newsdata_budget = int(newsdata_daily * 0.85)

        return {
            "contexts": list(allowed.values()),
            "marketaux_budget": marketaux_budget,
            "newsdata_budget": newsdata_budget,
        }


# ── News fetchers ─────────────────────────────────────────────────────────────

def fetch_marketaux(query: str, api_key: str) -> list[dict]:
    import httpx
    try:
        resp = httpx.get(
            "https://api.marketaux.com/v1/news/all",
            params={"search": query, "api_token": api_key, "limit": 5, "language": "en"},
            timeout=15,
        )
        resp.raise_for_status()
        return [
            {"headline": a["title"], "source": a["source"], "published_at": a["published_at"]}
            for a in resp.json().get("data", [])
        ]
    except Exception:
        return []


def fetch_newsdata(query: str, api_key: str) -> list[dict]:
    import httpx
    try:
        resp = httpx.get(
            "https://newsdata.io/api/1/news",
            params={"q": query, "apikey": api_key, "language": "en", "size": 5},
            timeout=15,
        )
        resp.raise_for_status()
        return [
            {
                "headline": a["title"],
                "source": a.get("source_id", "NewsData"),
                "published_at": a.get("pubDate", datetime.now(timezone.utc).isoformat()),
            }
            for a in resp.json().get("results", [])
        ]
    except Exception:
        return []


def fetch_yahoo_rss(ticker: str) -> list[dict]:
    import feedparser
    try:
        feed = feedparser.parse(f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US")
        return [
            {
                "headline": e.title,
                "source": "Yahoo Finance",
                "published_at": e.get("published", datetime.now(timezone.utc).isoformat()),
            }
            for e in feed.entries[:3]
        ]
    except Exception:
        return []


# ── LightRAG ingestion ────────────────────────────────────────────────────────

async def ingest_to_lightrag(headlines: list[dict], context_type: str, context_value: str) -> None:
    try:
        from lightrag import LightRAG
        from lightrag.llm.openai import openai_complete_if_cache, openai_embed
        from lightrag.utils import EmbeddingFunc
        import httpx
        import numpy as np

        llm_model = os.environ.get("LLM_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")
        embed_model = "nvidia/llama-nemotron-embed-vl-1b-v2:free"
        base_url = os.environ.get("LLM_BASE_URL", "https://openrouter.ai/api/v1")
        api_key = os.environ["OPENROUTER_API_KEY"]

        async def llm_func(prompt, system_prompt=None, history_messages=None, **kwargs):
            return await openai_complete_if_cache(
                llm_model,
                prompt,
                system_prompt=system_prompt,
                history_messages=history_messages or [],
                api_key=api_key,
                base_url=base_url,
                **kwargs,
            )

        async def embed_func(texts: list[str]) -> np.ndarray:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{base_url}/embeddings",
                    json={"model": embed_model, "input": texts},
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()["data"]
                return np.array([d["embedding"] for d in data])

        rag = LightRAG(
            working_dir=LIGHTRAG_DIR,
            llm_model_func=llm_func,
            embedding_func=EmbeddingFunc(
                embedding_dim=2048,
                max_token_size=8192,
                func=embed_func,
            ),
        )

        docs = [
            f"[{context_type.upper()}:{context_value}] {h['headline']} (Source: {h['source']}, Date: {h['published_at']})"
            for h in headlines
        ]
        await rag.ainsert(docs)
    except Exception as e:
        print(f"LightRAG ingest error: {e}")


# ── Main cron function ────────────────────────────────────────────────────────

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("finance-secrets")],
    volumes={"/lightrag-store": lightrag_vol},
    schedule=modal.Cron("0 1 * * *"),
    timeout=1800,
)
async def news_ingestor() -> None:
    import asyncio
    from supabase import create_client

    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    marketaux_key = os.environ.get("MARKETAUX_API_KEY", "")
    newsdata_key = os.environ.get("NEWSDATA_API_KEY", "")

    manager = AdaptiveQuotaManager()
    budget = manager.compute_budget(supabase, marketaux_daily=100, newsdata_daily=200)
    contexts = budget["contexts"]

    marketaux_used = 0
    newsdata_used = 0
    now = datetime.now(timezone.utc).isoformat()

    for ctx in contexts:
        ctx_type = ctx["type"]
        ctx_value = ctx["value"]
        user_ids: list[str] = ctx["user_ids"]

        headlines: list[dict] = []

        if marketaux_used < budget["marketaux_budget"]:
            fetched = fetch_marketaux(ctx_value, marketaux_key)
            headlines.extend(fetched)
            marketaux_used += 1

        if newsdata_used < budget["newsdata_budget"]:
            fetched = fetch_newsdata(ctx_value, newsdata_key)
            headlines.extend(fetched)
            newsdata_used += 1

        if ctx_type == "ticker":
            headlines.extend(fetch_yahoo_rss(ctx_value))

        if not headlines:
            continue

        # Write to news_cache for all matching users
        for user_id in user_ids:
            rows = [
                {
                    "user_id": user_id,
                    "context_type": ctx_type,
                    "context_value": ctx_value,
                    "headline": h["headline"],
                    "source": h["source"],
                    "published_at": h["published_at"] or now,
                }
                for h in headlines
                if h.get("headline")
            ]
            if rows:
                supabase.table("news_cache").upsert(
                    rows, on_conflict="user_id,headline,published_at", ignore_duplicates=True
                ).execute()

        # Ingest into LightRAG
        await ingest_to_lightrag(headlines, ctx_type, ctx_value)

    lightrag_vol.commit()

    # Log quota usage
    active_users = len({uid for ctx in contexts for uid in ctx["user_ids"]})
    for provider, used in [("marketaux", marketaux_used), ("newsdata", newsdata_used)]:
        budget_val = budget["marketaux_budget"] if provider == "marketaux" else budget["newsdata_budget"]
        supabase.table("api_quota_log").insert({
            "run_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "provider": provider,
            "budget": budget_val,
            "used": used,
            "dropped_contexts": len(budget["contexts"]),
            "active_users": active_users,
        }).execute()

    print(f"News ingestor done. Marketaux: {marketaux_used}, NewsData: {newsdata_used}, Contexts: {len(contexts)}")
