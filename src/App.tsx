/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        setUploadProgress(100);
        clearInterval(interval);
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      } else {
        setUploadProgress(progress);
      }
    }, 200);
  };

  useEffect(() => {
    // Particles
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    let pts: any[] = [];
    let animationFrameId: number;

    function rs() {
      if (cvs) {
        cvs.width = window.innerWidth;
        cvs.height = window.innerHeight;
      }
    }
    window.addEventListener('resize', rs);
    rs();

    for (let i = 0; i < 140; i++) {
      pts.push({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(Math.random() * 0.38 + 0.08),
        r: Math.random() * 1.1 + 0.4,
        bo: Math.random() * 0.28 + 0.08,
        p: Math.random() * Math.PI * 2
      });
    }

    function draw() {
      if(!ctx || !cvs) return;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        p.p += 0.018;
        ctx.fillStyle = `rgba(255,255,255,${p.bo * (0.55 + 0.45 * Math.sin(p.p))})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -2) { p.y = cvs.height + 2; p.x = Math.random() * cvs.width; }
        if (p.x < -2) p.x = cvs.width + 2;
        if (p.x > cvs.width + 2) p.x = -2;
      });
      animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    // Rings Generator
    function gr(id: string, cx: number, cy: number, rx: number, ry: number, rot: number) {
      const g = document.getElementById(id);
      if (!g) return;
      g.innerHTML = '';
      for (let i = 0; i < 48; i++) {
        let ang = (i / 48) * Math.PI * 2;
        let t = rot * Math.PI / 180;
        let x = cx + rx * Math.cos(ang) * Math.cos(t) - ry * Math.sin(ang) * Math.sin(t);
        let y = cy + rx * Math.cos(ang) * Math.sin(t) + ry * Math.sin(ang) * Math.cos(t);
        let op = 0.15 + 0.55 * Math.abs(Math.sin((ang + (id === 'rg2' ? Math.PI : 0))));
        let circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circ.setAttribute("cx", x.toString());
        circ.setAttribute("cy", y.toString());
        circ.setAttribute("r", "1.8");
        circ.setAttribute("fill", "#00ff50");
        circ.setAttribute("opacity", op.toString());
        g.appendChild(circ);
      }
    }
    gr('rg1', 90, 70, 70, 28, -15);
    gr('rg2', 190, 70, 70, 28, 15);

    // Scroll & Nav Intersections
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(
            `nav a[href="#${entry.target.id}"]`
          );
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));

    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12
    });

    sections.forEach(section => animObserver.observe(section));

    const h1Text = document.getElementById('h-text');
    const orbit = document.getElementById('orbit');
    let hObs: IntersectionObserver | null = null;
    if (h1Text && orbit) {
        hObs = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) h1Text.classList.add('hero-text-exit');
        else h1Text.classList.remove('hero-text-exit');
        }, { threshold: 0.1 });
        hObs.observe(orbit);
    }

    // Scroll Ind Remove & BTT toggle
    const handleScroll = () => {
      const scroller = document.getElementById('scroller');
      const bttBtn = document.getElementById('btt-btn');
      if (window.scrollY > window.innerHeight * 0.3) {
          if (scroller) scroller.style.opacity = '0';
          if (bttBtn) bttBtn.classList.add('show');
      } else {
          if (scroller) scroller.style.opacity = '1';
          if (bttBtn) bttBtn.classList.remove('show');
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Nexus Interaction
    const ni = document.getElementById('n-input') as HTMLInputElement;
    const nr = document.getElementById('nexus-res');
    
    const handleFocus = () => { if (nr) nr.style.display = 'block'; };
    if (ni) {
        ni.addEventListener('focus', handleFocus);
        ni.addEventListener('keydown', handleFocus);
    }
    
    // Nav click
    const handleNavClick = (e: Event) => {
      e.preventDefault();
      const targetElement = e.currentTarget as HTMLAnchorElement;
      const href = targetElement.getAttribute('href');
      if (href) {
        const target = document.getElementById(href.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    navLinks.forEach(link => {
      link.addEventListener('click', handleNavClick);
    });

    return () => {
      window.removeEventListener('resize', rs);
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      animObserver.disconnect();
      if(hObs) hObs.disconnect();
      if (ni) {
          ni.removeEventListener('focus', handleFocus);
          ni.removeEventListener('keydown', handleFocus);
      }
      navLinks.forEach(a => {
        a.removeEventListener('click', handleNavClick);
      });
    };
  }, []);

  const sq = (t: string) => {
    const ni = document.getElementById('n-input') as HTMLInputElement;
    const nr = document.getElementById('nexus-res');
    if (ni) ni.value = t;
    if (nr) nr.style.display = 'block';
  };

  const chartData = [
    { month: 'Feb', food: 7800, shopping: 6900, transport: 3200 },
    { month: 'Mar', food: 8100, shopping: 9400, transport: 2900 },
    { month: 'Apr', food: 8420, shopping: 11200, transport: 3180 }
  ];

  return (
    <>
      <div className="fog f1"></div>
      <div className="fog f2"></div>
      <div className="fog f3"></div>
      <canvas id="canvas" ref={canvasRef}></canvas>

      <nav className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', zIndex: 101, position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L17 9L9 17L1 9Z" stroke="#00ff50" strokeWidth="1.2" />
            <path d="M9 5L13 9L9 13L5 9Z" stroke="#00ff50" strokeWidth="1" opacity="0.6" />
          </svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '15px', letterSpacing: '-0.03em', color: 'white' }}>LUCE</span>
        </div>
        <div className="nl desktop-only" id="nav-links">
          <a href="#orbit" className="active"><span className="ad">◆ </span>Orbit</a>
          <a href="#pulse"><span className="ad">◆ </span>Pulse</a>
          <a href="#signal"><span className="ad">◆ </span>Signal</a>
          <a href="#arc"><span className="ad">◆ </span>Arc</a>
          <a href="#nexus-search"><span className="ad">◆ </span>Nexus</a>
          <a href="#end-root"><span className="ad">◆ </span>Root</a>
        </div>
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="nav-cta">Connect</button>
          <div className="pulse-dot"></div>
        </div>
        
        {/* Mobile menu toggle */}
        <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ cursor: 'pointer', zIndex: 101, position: 'relative' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </div>
      </nav>

      {/* Glassmorphic Mobile Menu */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nl">
          <a href="#orbit" onClick={() => setIsMobileMenuOpen(false)}>Orbit</a>
          <a href="#pulse" onClick={() => setIsMobileMenuOpen(false)}>Pulse</a>
          <a href="#signal" onClick={() => setIsMobileMenuOpen(false)}>Signal</a>
          <a href="#arc" onClick={() => setIsMobileMenuOpen(false)}>Arc</a>
          <a href="#nexus-search" onClick={() => setIsMobileMenuOpen(false)}>Nexus</a>
          <a href="#end-root" onClick={() => setIsMobileMenuOpen(false)}>Root</a>
          <button className="hero-cta" style={{ marginTop: '24px' }}>Connect</button>
        </div>
      </div>

      <section id="orbit">
        <div className="section-content orbit-content">
          <div className="content reveal-children">
            <div id="h-text">
              <span className="eyebrow">[ FINANCIAL INTELLIGENCE ]</span>
              <h1>Your Money,<br />Intelligently <span style={{ color: 'var(--accent)' }}>Mapped.</span></h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '40px' }}>
              <input 
                type="file" 
                accept=".csv,.xlsx,.pdf,.txt" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
              />
              <button 
                className={`hero-cta ${isUploading ? 'uploading' : ''}`} 
                style={{ marginTop: 0, position: 'relative', overflow: 'hidden' }} 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading && (
                  <div 
                    className="upload-progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 2 }}>
                  {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload Statement'} &rarr;
                </span>
              </button>
              <div aria-label="Scroll to explore" role="button" className="scroll-ind" id="scroller" onClick={() => document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>&darr; Scroll to explore</div>
            </div>
          </div>
          <div className="hero-3d-logo">
            <div className="hero-3d-wrapper">
              <div className="l-diamond ld-outer"></div>
              <div className="l-diamond ld-inner"></div>
              <div className="l-diamond ld-inner-2"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="pulse">
        <div className="section-content pulse-content">
          <div className="reveal-children" style={{ textAlign: 'center' }}>
            <span className="eyebrow">[ PULSE ]</span>
            <h2>Your Financial Pulse</h2>
          </div>
          <div className="p-grid">
            <div className="tile metric-tile">
              <div className="m-row1">
                <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="10" cy="10" r="7.5" />
                  <path d="M7 13L13 7M13 7H9M13 7V11" />
                </svg>
                <span className="m-lbl">MONTHLY SPEND</span>
                <span style={{ marginLeft: 'auto' }} className="tile-number">[ 1.0 ]</span>
              </div>
              <div className="m-val">₹42,180</div>
              <div className="m-sub">vs ₹38,400 forecast</div>
              <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '78%', background: 'var(--accent)' } as any}></div></div>
            </div>
            <div className="tile metric-tile">
              <div className="m-row1">
                <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M10 1.5L3.5 5.5V10.5C3.5 14 10 17 10 17S16.5 14 16.5 10.5V5.5Z" />
                  <path d="M7 10L9 12L13 8" />
                </svg>
                <span className="m-lbl">SAVINGS RATE</span>
                <span style={{ marginLeft: 'auto' }} className="tile-number">[ 2.0 ]</span>
              </div>
              <div className="m-val">23.4%</div>
              <div className="m-sub">+2.1% vs last month</div>
              <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '64%', background: 'var(--accent)' } as any}></div></div>
            </div>
            <div className="tile metric-tile m-alert" style={{ transition: 'border-color .35s,box-shadow .35s,transform .35s' }}>
              <div className="m-row1">
                <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 10L5.5 4L9 10L12.5 4L16 10" />
                  <circle cx="5.5" cy="4" r="1" fill="#00ff50" stroke="none" />
                  <circle cx="12.5" cy="4" r="1" fill="#00ff50" stroke="none" />
                </svg>
                <span className="m-lbl">ANOMALIES</span>
                <span style={{ marginLeft: 'auto' }} className="tile-number">[ 3.0 ]</span>
              </div>
              <div className="m-val">3 flagged</div>
              <div className="m-sub">₹8,240 unusual activity</div>
              <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '40%', background: 'var(--red)' } as any}></div></div>
            </div>
            <div className="tile metric-tile">
              <div className="m-row1">
                <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="3" width="14" height="13" rx="2" />
                  <path d="M6 3V1M12 3V1M2 7H16" />
                  <path d="M11 12H15M15 12L13 10M15 12L13 14" />
                </svg>
                <span className="m-lbl">FORECAST ACCURACY</span>
                <span style={{ marginLeft: 'auto' }} className="tile-number">[ 4.0 ]</span>
              </div>
              <div className="m-val">91.2%</div>
              <div className="m-sub">Next 30 days</div>
              <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '91%', background: 'var(--accent)' } as any}></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="signal">
        <div className="section-content signal-content">
          <div className="s-left reveal-children">
            <span className="eyebrow">[ SIGNAL ]</span>
            <h2>Anomalies,<br />Surfaced.</h2>
            <p>Unusual patterns detected in real time. Every outlier explained, every risk scored before it reaches your balance.</p>
          </div>
          <div className="s-right reveal-children">
            <div className="tile alert-card">
              <div className="ac-r1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff3b3b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2L15 14H1Z" />
                  <path d="M8 7V10" />
                  <circle cx="8" cy="12.5" r="0.8" fill="#ff3b3b" stroke="none" />
                </svg>
                <span className="ac-m">Amazon Prime</span>
                <span className="ac-b">ANOMALY</span>
              </div>
              <div className="ac-r2"><span className="ac-v">₹12,499</span><span className="ac-d">Apr 17</span></div>
              <div className="ac-e">4.2× your monthly Amazon average. Possible duplicate charge or unrecognised subscription renewal.</div>
              <div className="ac-mul">4.2× your monthly average</div>
            </div>
            <div className="tile alert-card">
              <div className="ac-r1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff3b3b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2L15 14H1Z" />
                  <path d="M8 7V10" />
                  <circle cx="8" cy="12.5" r="0.8" fill="#ff3b3b" stroke="none" />
                </svg>
                <span className="ac-m">Zomato</span>
                <span className="ac-b">ANOMALY</span>
              </div>
              <div className="ac-r2"><span className="ac-v">₹3,840</span><span className="ac-d">Apr 15</span></div>
              <div className="ac-e">Restaurant spend 3.1× above your weekly baseline. Single-session order detected.</div>
              <div className="ac-mul">3.1× your weekly baseline</div>
            </div>
            <div className="tile alert-card">
              <div className="ac-r1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff3b3b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2L15 14H1Z" />
                  <path d="M8 7V10" />
                  <circle cx="8" cy="12.5" r="0.8" fill="#ff3b3b" stroke="none" />
                </svg>
                <span className="ac-m">Unknown Merchant</span>
                <span className="ac-b">ANOMALY</span>
              </div>
              <div className="ac-r2"><span className="ac-v">₹6,200</span><span className="ac-d">Apr 12</span></div>
              <div className="ac-e">No historical match found. New payee. Manual review recommended before next cycle.</div>
              <div className="ac-mul">First transaction detected</div>
            </div>
          </div>
        </div>
      </section>

      <section id="arc">
        <div className="section-content arc-content">
          <div className="a-left reveal-children">
            <span className="eyebrow">[ ARC ]</span>
            <h2>Your Spend,<br />Forecasted.</h2>
            <p>Five categories. Actual vs predicted. The Shopping overspend is real.</p>
            <div className="cat-bars">
              <div className="cat-row">
                <div className="c-head"><span className="c-name">Food &amp; Dining</span><span className="c-amt">₹8,420 <span className="c-fcst">/ ₹9,000</span></span></div>
                <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '93%', background: 'var(--accent)' } as any}></div><div className="bf-m" style={{ left: '100%' }}></div></div>
              </div>
              <div className="cat-row">
                <div className="c-head"><span className="c-name">Transport</span><span className="c-amt">₹3,180 <span className="c-fcst">/ ₹3,500</span></span></div>
                <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '91%', background: 'var(--accent)' } as any}></div><div className="bf-m" style={{ left: '100%' }}></div></div>
              </div>
              <div className="cat-row">
                <div className="c-head"><span className="c-name">Shopping</span><span className="c-amt">₹11,200 <span className="c-fcst">/ ₹8,000</span></span></div>
                <div className="bar-track"><div className="bar-fill overspent" style={{ '--target-width': '100%' } as any}></div><div className="bf-m" style={{ left: '71%' }}></div></div>
              </div>
              <div className="cat-row">
                <div className="c-head"><span className="c-name">Bills &amp; Utilities</span><span className="c-amt">₹4,960 <span className="c-fcst">/ ₹5,000</span></span></div>
                <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '99%', background: 'var(--accent)' } as any}></div><div className="bf-m" style={{ left: '100%' }}></div></div>
              </div>
              <div className="cat-row">
                <div className="c-head"><span className="c-name">Entertainment</span><span className="c-amt">₹2,100 <span className="c-fcst">/ ₹3,000</span></span></div>
                <div className="bar-track"><div className="bar-fill" style={{ '--target-width': '70%', background: 'var(--accent)' } as any}></div><div className="bf-m" style={{ left: '100%' }}></div></div>
              </div>
            </div>
          </div>
          <div className="a-right reveal-children">
            <h3>3-Month Trend</h3>
            <p className="a-r-sub">Category spend over time</p>
            <div id="trend-chart" style={{ width: '100%', height: '240px', marginTop: '12px', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide={true} />
                  <Tooltip contentStyle={{ background: 'rgba(10,20,10,0.95)', border: '1px solid rgba(0,255,80,0.18)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: 11, color: 'white' }} />
                  <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.5)', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="food" name="Food" stroke="#00ff50" strokeWidth={2} dot={{ r: 3, fill: '#00ff50', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="shopping" name="Shopping" stroke="#00ccff" strokeWidth={2} dot={{ r: 3, fill: '#00ccff', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="transport" name="Transport" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} dot={{ r: 3, fill: 'rgba(255,255,255,0.45)', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section id="nexus">
        <div className="section-content nexus-content">
          <div style={{ maxWidth: '860px', margin: 'auto', width: '100%' }} className="reveal-children">
            <div className="tile" style={{ width: '100%', padding: '28px 34px', fontFamily: "'Syne', sans-serif" }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '18px' }}><span className="eyebrow">[ PORTFOLIO INTELLIGENCE ]</span></div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'white', marginBottom: '4px' }}>Market Brief</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '18px' }}>Sunday, Apr 19, 2026</div>
                <div className="nw-r">
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }}></div>
                  <div style={{ lineHeight: 1.5 }}><span style={{ fontSize: '12px', color: 'white' }}>Nifty 50 edges higher on global cues, IT sector leads gains</span><span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; ET Markets</span></div>
                </div>
                <div className="nw-r">
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }}></div>
                  <div style={{ lineHeight: 1.5 }}><span style={{ fontSize: '12px', color: 'white' }}>Infosys upgrades full-year guidance following Q4 beat</span><span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; Reuters</span></div>
                </div>
                <div className="nw-r">
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', marginTop: '8px', flexShrink: 0 }}></div>
                  <div style={{ lineHeight: 1.5 }}><span style={{ fontSize: '12px', color: 'white' }}>RBI holds rates steady; policy stance unchanged for Q2</span><span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}> &middot; Mint</span></div>
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L18 10L10 18L2 10Z" /><path d="M10 6L14 10L10 14L6 10Z" opacity="0.5" /><circle cx="10" cy="10" r="1.5" fill="var(--accent)" stroke="none" /></svg>
              <input type="text" className="ni" id="n-input" placeholder="Ask anything about your finances..." />
              <button className="ns"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7H12M8 3L12 7L8 11" /></svg></button>
            </div>
            <div id="nexus-res" style={{ display: 'none', marginTop: '12px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
              <div className="tile" style={{ padding: '16px 22px', minHeight: '72px', position: 'relative', overflow: 'hidden' }}>
                <div className="shim"></div><div style={{ fontSize: '12px', color: 'var(--text-secondary)', position: 'relative', zIndex: 2 }}>Querying your financial corpus...</div>
              </div>
            </div>
            <div className="query-chips" style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="qc" onClick={() => sq('What\'s my biggest overspend?')}>What's my biggest overspend?</button>
              <button className="qc" onClick={() => sq('Compare Feb vs Mar')}>Compare Feb vs Mar</button>
              <button className="qc" onClick={() => sq('Flag unusual subscriptions')}>Flag unusual subscriptions</button>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="end-root">
        <div className="rb-ov"></div>
        <div className="rc section-content root-content">
          <div className="scene-logo">
            <div className="logo-3d-wrapper">
              <div className="l-diamond ld-outer"></div>
              <div className="l-diamond ld-inner"></div>
              <div className="l-diamond ld-inner-2"></div>
            </div>
          </div>
          <div className="end-cta-row">
            <h2>LUCE</h2>
            <button className="hero-cta" style={{ marginTop: 0 }} onClick={() => document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth' })}>Open Dashboard &rarr;</button>
          </div>
          <div className="root-tagline"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '8px' }}><path d="M8 1.5L2 5V9.5C2 12.5 8 15 8 15S14 12.5 14 9.5V5Z" /><path d="M5.5 8L7.5 10L11 6" /></svg>financial intelligence, grounded in your data.</div>
          <div className="footer-grid">
            <div>
              <div className="fh">[ PAGES ]</div>
              <a href="#orbit" className="fl">Orbit</a><a href="#pulse" className="fl">Pulse</a><a href="#signal" className="fl">Signal</a><a href="#arc" className="fl">Arc</a><a href="#nexus-search" className="fl">Nexus</a>
            </div>
            <div>
              <div className="fh">[ CONNECT ]</div>
              <a href="#" className="fl">GitHub</a><a href="#" className="fl">LinkedIn</a>
            </div>
            <div>
              <div className="fh">[ BUILT WITH ]</div>
              <span className="fl">Claude API</span><span className="fl">LightRAG</span><span className="fl">Modal</span><span className="fl">Supabase</span>
            </div>
          </div>
          <div className="copyright">&copy; 2026 Luce — AI Finance Copilot. Built as a public portfolio project.</div>
        </div>
      </section>

      <button id="btt-btn" className="btt-btn" aria-label="Back to top" onClick={() => document.getElementById('orbit')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
