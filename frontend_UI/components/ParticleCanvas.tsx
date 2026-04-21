'use client'
import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    let pts: any[] = []
    let animationFrameId: number

    function rs() {
      if (cvs) {
        cvs.width = window.innerWidth
        cvs.height = window.innerHeight
      }
    }
    window.addEventListener('resize', rs)
    rs()

    for (let i = 0; i < 140; i++) {
      pts.push({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(Math.random() * 0.38 + 0.08),
        r: Math.random() * 1.1 + 0.4,
        bo: Math.random() * 0.28 + 0.08,
        p: Math.random() * Math.PI * 2
      })
    }

    function draw() {
      if (!ctx || !cvs) return
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      pts.forEach(p => {
        p.p += 0.018
        ctx.fillStyle = `rgba(255,255,255,${p.bo * (0.55 + 0.45 * Math.sin(p.p))})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        p.x += p.vx
        p.y += p.vy
        if (p.y < -2) { p.y = cvs.height + 2; p.x = Math.random() * cvs.width }
        if (p.x < -2) p.x = cvs.width + 2
        if (p.x > cvs.width + 2) p.x = -2
      })
      animationFrameId = requestAnimationFrame(draw)
    }
    draw()

    function gr(id: string, cx: number, cy: number, rx: number, ry: number, rot: number) {
      const g = document.getElementById(id)
      if (!g) return
      g.innerHTML = ''
      for (let i = 0; i < 48; i++) {
        const ang = (i / 48) * Math.PI * 2
        const t = rot * Math.PI / 180
        const x = cx + rx * Math.cos(ang) * Math.cos(t) - ry * Math.sin(ang) * Math.sin(t)
        const y = cy + rx * Math.cos(ang) * Math.sin(t) + ry * Math.sin(ang) * Math.cos(t)
        const op = 0.15 + 0.55 * Math.abs(Math.sin((ang + (id === 'rg2' ? Math.PI : 0))))
        const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circ.setAttribute('cx', x.toString())
        circ.setAttribute('cy', y.toString())
        circ.setAttribute('r', '1.8')
        circ.setAttribute('fill', '#00ff50')
        circ.setAttribute('opacity', op.toString())
        g.appendChild(circ)
      }
    }
    gr('rg1', 90, 70, 70, 28, -15)
    gr('rg2', 190, 70, 70, 28, 15)

    const sections = document.querySelectorAll('section[id]')
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          animObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    sections.forEach(section => animObserver.observe(section))

    const h1Text = document.getElementById('h-text')
    const orbit = document.getElementById('orbit')
    let hObs: IntersectionObserver | null = null
    if (h1Text && orbit) {
      hObs = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) h1Text.classList.add('hero-text-exit')
        else h1Text.classList.remove('hero-text-exit')
      }, { threshold: 0.1 })
      hObs.observe(orbit)
    }

    return () => {
      window.removeEventListener('resize', rs)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      animObserver.disconnect()
      if (hObs) hObs.disconnect()
    }
  }, [])

  return <canvas id="canvas" ref={canvasRef} />
}
