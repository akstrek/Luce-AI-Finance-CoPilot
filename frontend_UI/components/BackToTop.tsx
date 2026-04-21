'use client'
import { useEffect } from 'react'

export default function BackToTop() {
  useEffect(() => {
    const handleScroll = () => {
      const scroller = document.getElementById('scroller')
      const bttBtn = document.getElementById('btt-btn')
      if (window.scrollY > window.innerHeight * 0.3) {
        if (scroller) scroller.style.opacity = '0'
        if (bttBtn) bttBtn.classList.add('show')
      } else {
        if (scroller) scroller.style.opacity = '1'
        if (bttBtn) bttBtn.classList.remove('show')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      id="btt-btn"
      className="btt-btn"
      aria-label="Back to top"
      onClick={() => document.getElementById('orbit')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}
