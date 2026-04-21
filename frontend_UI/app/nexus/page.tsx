'use client'
import { useState } from 'react'

export default function NexusPage() {
  const [query, setQuery] = useState('')
  const [showResult, setShowResult] = useState(false)

  const sq = (t: string) => {
    setQuery(t)
    setShowResult(true)
  }

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
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '18px' }}>Sunday, Apr 19, 2026</div>
                <div className="nw-r">
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }} />
                  <div style={{ lineHeight: 1.5 }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Nifty 50 edges higher on global cues, IT sector leads gains</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; ET Markets</span>
                  </div>
                </div>
                <div className="nw-r">
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }} />
                  <div style={{ lineHeight: 1.5 }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Infosys upgrades full-year guidance following Q4 beat</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; Reuters</span>
                  </div>
                </div>
                <div className="nw-r">
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }} />
                  <div style={{ lineHeight: 1.5 }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>RBI holds rates steady; policy stance unchanged for Q2</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; Mint</span>
                  </div>
                </div>
              </div>
              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <div className="tp"><span style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>INFY</span><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>+1.2%</span></div>
                <div className="tp"><span style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>TCS</span><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)' }}>-0.4%</span></div>
                <div className="tp"><span style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>NIFTY50</span><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>+0.8%</span></div>
                <div style={{ fontSize: '8px', color: 'rgba(0,255,80,0.28)', marginTop: '8px', letterSpacing: '0.05em' }}>Powered by LightRAG</div>
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
                onKeyDown={() => setShowResult(true)}
              />
              <button className="ns">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7H12M8 3L12 7L8 11" />
                </svg>
              </button>
            </div>
            {showResult && (
              <div id="nexus-res" style={{ marginTop: '12px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
                <div className="tile" style={{ padding: '16px 22px', minHeight: '72px', position: 'relative', overflow: 'hidden' }}>
                  <div className="shim" />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', position: 'relative', zIndex: 2 }}>Querying your financial corpus...</div>
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
