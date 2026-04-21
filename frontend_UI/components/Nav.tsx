'use client'
import { useState, useEffect } from 'react'

export default function Nav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const navLinks = document.querySelectorAll('nav a[href^="#"]')

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'))
          const activeLink = document.querySelector(`nav a[href="#${entry.target.id}"]`)
          if (activeLink) activeLink.classList.add('active')
        }
      })
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 })

    sections.forEach(section => observer.observe(section))

    const handleNavClick = (e: Event) => {
      e.preventDefault()
      const target = e.currentTarget as HTMLAnchorElement
      const href = target.getAttribute('href')
      if (href) {
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    navLinks.forEach(link => link.addEventListener('click', handleNavClick))

    return () => {
      observer.disconnect()
      navLinks.forEach(link => link.removeEventListener('click', handleNavClick))
    }
  }, [])

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
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
          <div className="pulse-dot" />
        </div>
        <div
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ cursor: 'pointer', zIndex: 101, position: 'relative' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen
              ? <path d="M18 6L6 18M6 6l12 12" />
              : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </div>
      </nav>

      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nl">
          <a href="#orbit" onClick={() => scrollTo('orbit')}>Orbit</a>
          <a href="#pulse" onClick={() => scrollTo('pulse')}>Pulse</a>
          <a href="#signal" onClick={() => scrollTo('signal')}>Signal</a>
          <a href="#arc" onClick={() => scrollTo('arc')}>Arc</a>
          <a href="#nexus-search" onClick={() => scrollTo('nexus-search')}>Nexus</a>
          <a href="#end-root" onClick={() => scrollTo('end-root')}>Root</a>
          <button className="hero-cta" style={{ marginTop: '24px' }}>Connect</button>
        </div>
      </div>
    </>
  )
}
