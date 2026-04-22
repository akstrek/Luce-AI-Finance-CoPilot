"""
LightRAG query web endpoint.
Input:  { user_id, query, tickers, recent_merchants }
Output: { summary, sources, raw_context }
"""

import modal
import os
import json
import re

app = modal.App("finance-copilot-rag")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi[standard]",
        "lightrag-hku==1.3.5",
        "httpx==0.27.2",
        "numpy==1.26.4",
    )
)

lightrag_vol = modal.Volume.from_name("lightrag-store", create_if_missing=True)
LIGHTRAG_DIR = "/lightrag-store/p10_finance"


async def build_rag():
    from lightrag import LightRAG
    from lightrag.llm.openai import openai_complete_if_cache
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

    return LightRAG(
        working_dir=LIGHTRAG_DIR,
        llm_model_func=llm_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=2048,
            max_token_size=8192,
            func=embed_func,
        ),
    )


def extract_sources(raw: str) -> list[str]:
    sources = re.findall(r"Source:\s*([^,\]]+)", raw)
    return list(dict.fromkeys(s.strip() for s in sources))[:5]


async def synthesise(query: str, raw_context: str) -> str:
    """Call OpenRouter to produce 3 bullet points from raw_context."""
    import httpx

    base_url = os.environ.get("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    api_key = os.environ["OPENROUTER_API_KEY"]
    llm_model = os.environ.get("LLM_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

    system = (
        "You are a concise financial analyst. "
        "Given retrieved context, answer the user query in exactly 3 bullet points. "
        "Each bullet starts with '• '. Plain text only, no markdown headers."
    )
    user_msg = f"Query: {query}\n\nContext:\n{raw_context[:6000]}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            json={
                "model": llm_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ],
                "temperature": 0.3,
                "max_tokens": 512,
            },
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            timeout=60,
        )
        resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("finance-secrets")],
    volumes={"/lightrag-store": lightrag_vol},
    timeout=120,
)
@modal.fastapi_endpoint(method="POST")
async def lightrag_query(item: dict) -> dict:
    from lightrag import QueryParam

    query: str = item.get("query", "")
    tickers: list[str] = item.get("tickers", [])
    recent_merchants: list[str] = item.get("recent_merchants", [])

    if not query:
        return {"summary": "No query provided.", "sources": [], "raw_context": ""}

    # Augment query with user context
    context_hint = ""
    if tickers:
        context_hint += f" Focus on: {', '.join(tickers)}."
    if recent_merchants:
        context_hint += f" Relevant merchants: {', '.join(recent_merchants[:3])}."

    full_query = query + context_hint

    rag = await build_rag()

    # Return early if the knowledge base has no indexed data
    data_file = os.path.join(LIGHTRAG_DIR, "kv_store_full_docs.json")
    if not os.path.exists(data_file) or os.path.getsize(data_file) <= 2:
        return {
            "summary": "• Knowledge base is empty — no documents have been inserted yet.\n• Upload a bank statement to start building your AI financial corpus.\n• Add portfolio tickers to enable market news retrieval.",
            "sources": [],
            "raw_context": "",
        }

    try:
        raw_context = await rag.aquery(full_query, param=QueryParam(mode="hybrid"))
    except Exception as e:
        return {"summary": f"Query failed: {e}", "sources": [], "raw_context": ""}

    if not raw_context or raw_context.strip() == "":
        return {
            "summary": "• No relevant information found in your portfolio corpus.\n• Upload bank statements to build your financial knowledge base.\n• Add portfolio tickers to enable market news retrieval.",
            "sources": [],
            "raw_context": "",
        }

    try:
        summary = await synthesise(query, raw_context)
    except Exception:
        summary = raw_context[:600]

    sources = extract_sources(raw_context)

    return {"summary": summary, "sources": sources, "raw_context": raw_context[:2000]}
