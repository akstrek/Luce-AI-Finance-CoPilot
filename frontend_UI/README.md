# Luce: AI Finance CoPilot

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Modal](https://img.shields.io/badge/Modal-7C3AED?style=flat-square)
![LightRAG](https://img.shields.io/badge/LightRAG-FF6B35?style=flat-square)
![OpenRouter](https://img.shields.io/badge/OpenRouter-FF4F00?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel)

---

## 🔍 What This Is

AI Finance CoPilot turns raw bank statements into a living, queryable knowledge graph. Upload a CSV, PDF, or Excel file and the system categorises every transaction, detects anomalies, forecasts next-month spend per category, and lets you ask plain-English questions against your own financial history — answered by LightRAG running on Modal's serverless infrastructure. Everything stays private: data is isolated by Supabase Row Level Security and never shared with any third-party model.

---

## 🚀 Live Demo

**[ai-finance-copilot.vercel.app](https://ai-finance-copilot.vercel.app)**

> Sign up → upload a bank statement → explore your dashboard in under 60 seconds.

---

## 🤖 Why LightRAG — and Why It Changes What's Possible

Standard RAG finds chunks of text *similar* to your query. LightRAG builds a **knowledge graph** on top of the vector index, capturing *relationships* between entities — merchants, categories, months, amounts — not just raw text.

- **What gets indexed** — every transaction row becomes a node: merchant, amount, date, category, and its semantic relationship to your broader spending profile
- **What the graph captures that vectors miss** — *"Zomato in April was 3× your March baseline"* is a relationship, not a similarity match; LightRAG can traverse it, vectors cannot
- **What queries become possible** — multi-hop questions like *"Which category grew fastest over the last three months, and which merchant is driving it?"* work because the graph holds temporal and categorical edges, not just embeddings
- **Why Modal resolved the two-deployment problem** — LightRAG needs a persistent Python process with heavy ML dependencies; Modal runs it as a serverless function that cold-starts on demand, eliminating the need for a second always-on server

---

## ☁️ Modal Architecture

### What Modal Is

Modal is a serverless compute platform for Python. You write a normal Python function, decorate it with `@modal.fastapi_endpoint`, run `modal deploy`, and Modal handles everything else: container build, dependency installation, scaling, HTTPS endpoint, and teardown. You pay only for actual compute time — zero when idle.

### How It Replaced a FastAPI Server + Second Deployment

The original architecture required two separate deployments: the Next.js frontend on Vercel, and a FastAPI Python sidecar on Railway to run LightRAG and the file processor. Two deployments meant two sets of environment variables, two deploy pipelines, two services to monitor, and coordination overhead whenever the Python side changed.

Modal collapsed both into **two HTTP endpoints behind a single command**:

```bash
modal deploy modal_backend/
```

| Endpoint | Purpose |
|---|---|
| `finance-copilot-processor` | Receives uploaded files, extracts transactions, writes to Supabase, inserts into the LightRAG graph |
| `finance-copilot-rag` | Accepts plain-English queries, traverses the knowledge graph, returns a structured answer |

No server to provision. No second repo to maintain. The Next.js API routes call these Modal endpoints over HTTPS exactly like any other API.

### What This Taught

Serverless ML deployment is practical at the portfolio scale. The old mental model — *"ML needs a server"* — breaks down when platforms like Modal handle the container lifecycle. Keep inference and data-processing logic as stateless Python functions, expose them over HTTP, and let the platform own the runtime. This pattern scales from a solo project to production without rearchitecting.

---

## ✨ Features

| Feature | AI Component | What You See |
|---|---|---|
| **Statement Parsing** | Modal Python — pandas + pdfplumber + openpyxl | Upload CSV / PDF / Excel → transactions appear in seconds |
| **Auto-Categorisation** | Rule engine + LLM fallback via OpenRouter | Every transaction tagged: Food, Transport, Shopping, Bills… |
| **Spending Forecast** | Weighted 3-month rolling average | ARC dashboard — actual vs predicted bars per category |
| **Anomaly Detection** | Z-score per merchant, statistical baseline | SIGNAL dashboard — flagged outliers with plain-English explanations |
| **Knowledge Graph Q&A** | LightRAG on Modal | NEXUS — ask anything, get answers grounded in your own data |
| **Market Intelligence** | NewsData.io + MarketAux APIs | Portfolio tickers + live headlines in one panel |
| **Category Correction** | User feedback loop → Supabase PATCH | Fix any miscategorised transaction inline |
| **Product Analytics** | Supabase `analytics_events` table | Every interaction logged: uploads, queries, corrections, anomaly actions |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Browser                                │
│   PULSE · ARC · SIGNAL · NEXUS · ORBIT · PROFILE              │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                   Next.js 15  ·  Vercel                        │
│                                                                │
│  /api/upload      /api/forecast    /api/anomalies              │
│  /api/ask         /api/news        /api/analytics              │
│  /api/transactions                 /api/portfolio/tickers      │
└──────────┬────────────────────────────┬───────────────────────┘
           │ POST (base64 file)         │ POST (plain-English query)
           ▼                            ▼
┌──────────────────────┐   ┌───────────────────────────────────┐
│  Modal · Processor   │   │     Modal · LightRAG Query        │
│                      │   │                                   │
│  pandas              │   │  Graph traversal                  │
│  pdfplumber          │   │  OpenRouter LLM completion        │
│  openpyxl            │   │  Workspace: p10_finance           │
│  classify + insert   │   │                                   │
└──────────┬───────────┘   └──────────────┬────────────────────┘
           │                              │
           ▼                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Supabase · Postgres                         │
│                                                                │
│  transactions · monthly_summaries · portfolio_tickers          │
│  news_cache · nexus_queries · analytics_events                 │
│                                                                │
│  Row Level Security — every query scoped to auth.uid()         │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Product Analytics

Every user interaction writes to `analytics_events`. Five metrics tracked out of the box:

| Metric | Formula |
|---|---|
| **Upload conversion rate** | `upload_success` events ÷ unique sessions with an `upload_attempt` |
| **Query engagement depth** | avg `nexus_query` events per user per session |
| **Correction rate** | `manually_corrected` events ÷ total transactions imported |
| **Anomaly action rate** | (`anomaly_confirmed` + `anomaly_dismissed`) ÷ total anomalies surfaced |
| **Ticker retention** | users with ≥1 `ticker_added` and no `ticker_removed` within 7 days |

---

## 🖼️ Screenshots

| Dashboard Overview | ARC — Spending Forecast | NEXUS — Q&A |
|---|---|---|
| *(add screenshot)* | *(add screenshot)* | *(add screenshot)* |

---

## ⚙️ Run Locally

### Prerequisites

- Node.js 20+
- Python 3.11+
- [Modal account](https://modal.com) — `pip install modal && modal token new`
- Supabase project with the schema from `supabase/migrations/001_init.sql`

### 1 — Clone and install

```bash
git clone https://github.com/akstrek/ai-finance-copilot.git
cd ai-finance-copilot/frontend_UI
npm install
```

### 2 — Environment variables

Create `.env.local` in `frontend_UI/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENROUTER_API_KEY=your_openrouter_key
NEXT_PUBLIC_LLM_MODEL=nvidia/nemotron-3-super-120b-a12b:free
LLM_BASE_URL=https://openrouter.ai/api/v1

MODAL_FILE_PROCESSOR_URL=https://<modal-username>--finance-copilot-processor-file-processor.modal.run
MODAL_LIGHTRAG_QUERY_URL=https://<modal-username>--finance-copilot-rag-lightrag-query.modal.run
MODAL_QUERY_URL=https://<modal-username>--finance-copilot-rag-lightrag-query.modal.run

NEWSDATA_API_KEY=your_newsdata_key
MARKETAUX_API_KEY=your_marketaux_key
```

### 3 — Deploy Modal backend

```bash
cd modal_backend
pip install -r requirements.txt
modal deploy file_processor.py
modal deploy lightrag_query.py
```

Copy the printed endpoint URLs into `.env.local`.

### 4 — Apply database schema

In your Supabase project → SQL Editor, run:

```
supabase/migrations/001_init.sql
```

### 5 — Start the dev server

```bash
cd frontend_UI
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔒 Privacy

This system is designed around one principle: your financial data belongs only to you.

- **Raw file bytes are never stored** — uploaded files are parsed in-memory on Modal and discarded immediately; only the extracted transaction rows reach Supabase
- **Queries never leave your data context** — NEXUS answers come from LightRAG traversing your own indexed data; the LLM receives only your data as context, not a shared pool
- **No cross-user data access is possible** — Supabase Row Level Security enforces `user_id = auth.uid()` on every table; no query can touch another user's rows at the database level

---

<div align="center">

Built by [Amritanshu Singh](https://www.linkedin.com/in/amritanshuksingh/) &nbsp;·&nbsp; [GitHub @akstrek](https://github.com/akstrek)

</div>
