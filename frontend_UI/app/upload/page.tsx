'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent } from '@/lib/log-event'

type Status = 'idle' | 'uploading' | 'done' | 'error'

export default function UploadPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/signup')
    })
  }, [router])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setProgress(40)
    setMessage('')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setMessage(data.error ?? 'Upload failed.'); return }
      setProgress(100)
      setStatus('done')
      const count: number = data.count ?? 0
      logEvent('upload_success', { count, categories: data.categories })
      setMessage(`${count} transaction${count !== 1 ? 's' : ''} uploaded and categorised.`)
    } catch {
      setStatus('error')
      setMessage('Upload failed.')
    }
  }

  const busy = status === 'uploading'

  return (
    <section style={{ minHeight: '100vh', background: '#020402', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <span className="eyebrow">[ ORBIT ]</span>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: 'white', margin: '8px 0 24px' }}>
          Upload Statement
        </h2>

        <label style={{ display: 'block', cursor: busy ? 'not-allowed' : 'pointer' }}>
          <div style={{
            border: '1px dashed rgba(0,255,80,0.2)', borderRadius: 16, padding: '48px 24px',
            textAlign: 'center', transition: 'border-color .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,80,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,255,80,0.2)')}
          >
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              {busy ? 'Processing…' : 'Drop a CSV, Excel, or PDF — or click to browse'}
            </p>
          </div>
          <input type="file" accept=".csv,.xlsx,.xls,.pdf" style={{ display: 'none' }} onChange={handleFile} disabled={busy} />
        </label>

        {busy && (
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width .3s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              Uploading and categorising…
            </p>
          </div>
        )}

        {status === 'done' && (
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(0,255,80,0.8)' }}>{message}</p>
        )}
        {status === 'error' && (
          <p style={{ marginTop: 20, fontSize: 13, color: '#ff4444' }}>Upload failed — please try again.</p>
        )}
      </div>
    </section>
  )
}
