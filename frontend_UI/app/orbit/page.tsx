'use client'
import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoDiamond from '@/components/LogoDiamond'
import { createClient } from '@/lib/supabase/client'
import { logEvent } from '@/lib/log-event'

export default function OrbitPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Auth gate — redirect unauthenticated users before touching the API
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { router.push('/signup'); return }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError('')

    // Simulate progress while the request is in-flight
    let simProgress = 0
    const interval = setInterval(() => {
      simProgress += Math.random() * 15
      if (simProgress < 90) setUploadProgress(simProgress)
    }, 300)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(interval)

      if (!res.ok) {
        const { error } = await res.json()
        setUploadError(error ?? 'Upload failed')
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      setUploadProgress(100)
      const { count, categories } = await res.json().catch(() => ({ count: 0, categories: {} }))
      logEvent('upload_success', { count, categories })
      window.dispatchEvent(new CustomEvent('data-refresh'))
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        document.getElementById('pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 500)
    } catch {
      clearInterval(interval)
      setUploadError('Upload failed — please try again')
      setIsUploading(false)
      setUploadProgress(0)
    }
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
          {uploadError && (
            <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--red)' }}>{uploadError}</p>
          )}
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
