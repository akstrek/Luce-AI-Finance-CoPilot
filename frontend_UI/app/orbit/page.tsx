'use client'
import React, { useRef, useState } from 'react'
import LogoDiamond from '@/components/LogoDiamond'

export default function OrbitPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadProgress(0)
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        setUploadProgress(100)
        clearInterval(interval)
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
          document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 500)
      } else {
        setUploadProgress(progress)
      }
    }, 200)
  }

  return (
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
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              )}
              <span style={{ position: 'relative', zIndex: 2 }}>
                {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload Statement'} &rarr;
              </span>
            </button>
            <div
              aria-label="Scroll to explore"
              role="button"
              className="scroll-ind"
              id="scroller"
              onClick={() => document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              &darr; Scroll to explore
            </div>
          </div>
        </div>
        <div className="hero-3d-logo">
          <div className="hero-3d-wrapper">
            <LogoDiamond />
          </div>
        </div>
      </div>
    </section>
  )
}
