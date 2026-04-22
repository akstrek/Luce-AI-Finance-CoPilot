'use client'
import { useState, useEffect, useCallback } from 'react'
import { logEvent } from '@/lib/log-event'

interface Headline { headline: string; source: string; published_at: string }
interface TickerData { symbol: string; price_delta: string | null }

const FALLBACK_HEADLINES: Headline[] = [
  { headline: 'Nifty 50 edges higher on global cues, IT sector leads gains', source: 'ET Markets', published_at: '' },
  { headline: 'Infosys upgrades full-year guidance following Q4 beat', source: 'Reuters', published_at: '' },
  { headline: 'RBI holds rates steady; policy stance unchanged for Q2', source: 'Mint', published_at: '' },
]

const FALLBACK_TICKERS: TickerData[] = [
  { symbol: 'INFY', price_delta: '+1.2%' },
  { symbol: 'TCS', price_delta: '-0.4%' },
  { symbol: 'NIFTY50', price_delta: '+0.8%' },
]

export default function NexusPage() {
  const [query, setQuery] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [resultText, setResultText] = useState('')
  const [querying, setQuerying] = useState(false)
  const [headlines, setHeadlines] = useState<Headline[]>(FALLBACK_HEADLINES)
  const [tickers, setTickers] = useState<TickerData[]>(FALLBACK_TICKERS)
  const [summary, setSummary] = useState('')
  const [realTickers, setRealTickers] = useState<string[]>([])
  const [tickerInput, setTickerInput] = useState('')
  const [tickerBusy, setTickerBusy] = useState(false)

  const fetchTickers = useCallback(() => {
    fetch('/api/portfolio/tickers')
      .then(r => r.json())
      .then((data: string[]) => { if (Array.isArray(data)) setRealTickers(data) })
      .catch(() => {})
  }, [])

  const fetchNews = useCallback(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then((data: { headlines?: Array<{ title: string; source: string }>; summary?: string }) => {
        if (data.headlines?.length) setHeadlines(data.headlines.map(h => ({ headline: h.title, source: h.source, published_at: '' })))
        if (data.summary) setSummary(data.summary)
      })
      .catch(() => {})
  }, [])

  const addTicker = async () => {
    const t = tickerInput.trim().toUpperCase()
    if (!t || tickerBusy) return
    setTickerBusy(true)
    await fetch('/api/portfolio/tickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: t }),
    }).catch(() => {})
    logEvent('ticker_added', { ticker: t })
    setTickerInput('')
    fetchTickers()
    fetchNews()
    setTickerBusy(false)
  }

  const removeTicker = async (ticker: string) => {
    await fetch(`/api/portfolio/tickers/${ticker}`, { method: 'DELETE' }).catch(() => {})
    logEvent('ticker_removed', { ticker })
    fetchTickers()
    fetchNews()
  }

  useEffect(() => {
    fetchTickers()
    fetchNews()
    fetch('/api/portfolio/news')
      .then(r => r.json())
      .then(data => { if (data.tickers?.length > 0) setTickers(data.tickers) })
      .catch(() => {})
  }, [fetchTickers, fetchNews])

  const runQuery = async (q: string) => {
    setQuery(q)
    setShowResult(true)
    setQuerying(true)
    setResultText('')
    logEvent('nexus_query', { query: q })
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setResultText(data.answer ?? data.error ?? 'No results found.')
    } catch {
      setResultText('Query failed — please try again.')
    } finally {
      setQuerying(false)
    }
  }

  const sq = (t: string) => { logEvent('nexus_chip', { chip: t }); runQuery(t) }

  return (
    <section id="nexus">
      <div className="section-content nexus-content">
        <div style={{ maxWidth: '860px', margin: 'auto', width: '100%' }} className="reveal-children">
          <div className="tile" style={{ width: '100%', padding: '28px 34px', fontFamily: "'Syne', sans-serif" }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '18px' }}>
                  <span className="eyebrow">[ PORTFOLIO INTELLIGENCE ]</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'white', marginBottom: '4px' }}>Market Brief</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                {headlines.slice(0, 3).map((h, i) => (
                  <div className="nw-r" key={i}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }} />
                    <div style={{ lineHeight: 1.5 }}>
                      <span style={{ fontSize: '12px', color: 'white' }}>{h.headline}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; {h.source}</span>
                    </div>
                  </div>
                ))}
                {summary && (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '14px', lineHeight: 1.6 }}>{summary}</p>
                )}
              </div>
              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                {realTickers.length === 0 ? (
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
                    Add portfolio tickers to enable market news retrieval.
                  </p>
                ) : (
                  realTickers.map(t => (
                    <div className="tp" key={t} style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>{t}</span>
                      <button
                        onClick={() => removeTicker(t)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
                        aria-label={`Remove ${t}`}
                      >×</button>
                    </div>
                  ))
                )}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <input
                    value={tickerInput}
                    onChange={e => setTickerInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') addTicker() }}
                    placeholder="AAPL"
                    maxLength={8}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '4px 7px', fontSize: '11px', color: 'white', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    onClick={addTicker}
                    disabled={tickerBusy || !tickerInput.trim()}
                    style={{ background: 'rgba(0,255,80,0.12)', border: '1px solid rgba(0,255,80,0.25)', borderRadius: '5px', color: 'var(--accent)', fontSize: '14px', padding: '0 8px', cursor: 'pointer', fontWeight: 700 }}
                  >+</button>
                </div>
                <div style={{ fontSize: '8px', color: 'rgba(0,255,80,0.28)', marginTop: '4px', letterSpacing: '0.05em' }}>Powered by LightRAG</div>
              </div>
            </div>
          </div>

          <div id="nexus-search" style={{ marginTop: '40px' }}>
            <div style={{ textAlign: 'center' }}><span className="eyebrow">[ NEXUS ]</span></div>
            <h2 className="nexus-heading">Ask Your<br />Financial Data.</h2>
            <div className="ni-w">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L18 10L10 18L2 10Z" />
                <path d="M10 6L14 10L10 14L6 10Z" opacity="0.5" />
                <circle cx="10" cy="10" r="1.5" fill="var(--accent)" stroke="none" />
              </svg>
              <input
                type="text"
                className="ni"
                id="n-input"
                placeholder="Ask anything about your finances..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setShowResult(true)}
                onKeyDown={e => { if (e.key === 'Enter' && query.trim()) runQuery(query) }}
              />
              <button className="ns" onClick={() => query.trim() && runQuery(query)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7H12M8 3L12 7L8 11" />
                </svg>
              </button>
            </div>
            {showResult && (
              <div id="nexus-res" style={{ marginTop: '12px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
                <div className="tile" style={{ padding: '16px 22px', minHeight: '72px', position: 'relative', overflow: 'hidden' }}>
                  <div className="shim" />
                  <div style={{ fontSize: '12px', color: querying ? 'var(--text-secondary)' : 'white', position: 'relative', zIndex: 2, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {querying ? 'Querying your financial corpus…' : resultText}
                  </div>
                </div>
              </div>
            )}
            <div className="query-chips" style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="qc" onClick={() => sq("What's my biggest overspend?")}>What&apos;s my biggest overspend?</button>
              <button className="qc" onClick={() => sq('Compare Feb vs Mar')}>Compare Feb vs Mar</button>
              <button className="qc" onClick={() => sq('Flag unusual subscriptions')}>Flag unusual subscriptions</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
