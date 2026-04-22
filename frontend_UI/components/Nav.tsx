'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Nav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleLogout = async () => {
    setDropdownOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name}`
    : user?.email?.split('@')[0] ?? 'Account'

  return (
    <>
      <nav className="nav">
        {/* LUCE = home button */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', zIndex: 101, position: 'relative', textDecoration: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L17 9L9 17L1 9Z" stroke="#00ff50" strokeWidth="1.2" />
            <path d="M9 5L13 9L9 13L5 9Z" stroke="#00ff50" strokeWidth="1" opacity="0.6" />
          </svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '15px', letterSpacing: '-0.03em', color: 'white' }}>LUCE</span>
        </Link>

        <div className="nl desktop-only" id="nav-links">
          <a href="#orbit" className="active"><span className="ad">◆ </span>Orbit</a>
          <a href="#pulse"><span className="ad">◆ </span>Pulse</a>
          <a href="#signal"><span className="ad">◆ </span>Signal</a>
          <a href="#arc"><span className="ad">◆ </span>Arc</a>
          <a href="#nexus-search"><span className="ad">◆ </span>Nexus</a>
          <a href="#end-root"><span className="ad">◆ </span>Root</a>
        </div>

        {/* Auth buttons — desktop */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!user ? (
            <>
              <Link href="/auth" className="text-[11px] font-bold uppercase tracking-widest text-[#00ff50]/80 hover:text-white transition-colors">Log In</Link>
              <Link href="/signup" className="bg-[#00ff50] text-[#020402] px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider hover:bg-[#00ff50]/90 transition-all shadow-[0_0_15px_rgba(0,255,80,0.2)]">Sign Up</Link>
            </>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(0,255,80,0.06)', border: '1px solid rgba(0,255,80,0.18)',
                  borderRadius: '999px', padding: '6px 14px 6px 8px', cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif", color: 'white', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}
              >
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,255,80,0.15)', border: '1px solid rgba(0,255,80,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#00ff50', fontWeight: 800 }}>
                  {displayName[0].toUpperCase()}
                </span>
                {displayName}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '160px',
                  background: 'rgba(10,20,10,0.98)', border: '1px solid rgba(0,255,80,0.15)',
                  borderRadius: '12px', padding: '6px', zIndex: 200,
                  backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s' }}
                    className="hover:bg-white/5"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(0,255,80,0.7)" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="7" cy="4.5" r="2.5" />
                      <path d="M1.5 12.5c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" />
                    </svg>
                    Profile
                  </Link>
                  <div style={{ height: '1px', background: 'rgba(0,255,80,0.08)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', color: 'rgba(255,80,80,0.85)', fontSize: '12px', fontWeight: 600, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', transition: 'background 0.15s' }}
                    className="hover:bg-red-500/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,80,80,0.8)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9.5 9.5L12 7l-2.5-2.5M12 7H5" />
                    </svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
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
          <div className="flex flex-row gap-3 mt-12 w-full px-8">
            {!user ? (
              <>
                <Link href="/auth" className="hero-cta flex-1 justify-center" style={{ background: 'transparent', border: '1px solid rgba(0,255,80,0.3)', color: 'white', padding: '12px 0', marginTop: 0 }} onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                <Link href="/signup" className="hero-cta flex-1 justify-center" style={{ background: 'var(--accent)', color: 'black', border: 'none', padding: '12px 0', marginTop: 0 }} onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
              </>
            ) : (
              <>
                <Link href="/profile" className="hero-cta flex-1 justify-center" style={{ background: 'transparent', border: '1px solid rgba(0,255,80,0.3)', color: 'white', padding: '12px 0', marginTop: 0 }} onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                <button className="hero-cta flex-1 justify-center" style={{ background: 'rgba(255,60,60,0.15)', color: 'rgba(255,80,80,0.9)', border: '1px solid rgba(255,60,60,0.2)', padding: '12px 0', marginTop: 0 }} onClick={handleLogout}>Log Out</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
