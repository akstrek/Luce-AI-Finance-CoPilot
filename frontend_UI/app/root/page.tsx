'use client'
import LogoDiamond from '@/components/LogoDiamond'

export default function RootPage() {
  return (
    <section id="end-root">
      <div className="rb-ov" />
      <div className="rc section-content root-content">
        <div className="scene-logo">
          <div className="logo-3d-wrapper">
            <LogoDiamond />
          </div>
        </div>
        <div className="end-cta-row">
          <h2>LUCE</h2>
          <button
            className="hero-cta"
            style={{ marginTop: 0 }}
            onClick={() => document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Open Dashboard &rarr;
          </button>
        </div>
        <div className="root-tagline">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '8px' }}>
            <path d="M8 1.5L2 5V9.5C2 12.5 8 15 8 15S14 12.5 14 9.5V5Z" />
            <path d="M5.5 8L7.5 10L11 6" />
          </svg>
          financial intelligence, grounded in your data.
        </div>
        <div className="footer-grid">
          <div>
            <div className="fh">[ PAGES ]</div>
            <a href="#orbit" className="fl">Orbit</a>
            <a href="#pulse" className="fl">Pulse</a>
            <a href="#signal" className="fl">Signal</a>
            <a href="#arc" className="fl">Arc</a>
            <a href="#nexus-search" className="fl">Nexus</a>
          </div>
          <div>
            <div className="fh">[ CONNECT ]</div>
            <a href="#" className="fl">GitHub</a>
            <a href="#" className="fl">LinkedIn</a>
          </div>
          <div>
            <div className="fh">[ BUILT WITH ]</div>
            <span className="fl">Claude API</span>
            <span className="fl">LightRAG</span>
            <span className="fl">Modal</span>
            <span className="fl">Supabase</span>
          </div>
        </div>
        <div className="copyright">&copy; 2026 Luce — AI Finance Copilot. Built as a public portfolio project.</div>
      </div>
    </section>
  )
}
