'use client'
import { useEffect, useState, useCallback } from 'react'
import AlertCard from '@/components/AlertCard'
import { logEvent } from '@/lib/log-event'

interface AnomalyRow {
  id: string
  merchant: string
  amount: number
  date: string
  multiplier: string
  explanation: string
}

const FALLBACK: AnomalyRow[] = [
  {
    id: '1',
    merchant: 'Amazon Prime',
    amount: -12499,
    date: 'Apr 17',
    explanation: '4.2× your monthly Amazon average. Possible duplicate charge or unrecognised subscription renewal.',
    multiplier: '4.2× your monthly average',
  },
  {
    id: '2',
    merchant: 'Zomato',
    amount: -3840,
    date: 'Apr 15',
    explanation: 'Restaurant spend 3.1× above your weekly baseline. Single-session order detected.',
    multiplier: '3.1× your weekly baseline',
  },
  {
    id: '3',
    merchant: 'Unknown Merchant',
    amount: -6200,
    date: 'Apr 12',
    explanation: 'No historical match found. New payee. Manual review recommended before next cycle.',
    multiplier: 'First transaction detected',
  },
]

function formatAmount(amount: number) {
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function SignalPage() {
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>(FALLBACK)

  const loadData = useCallback(() => {
    fetch('/api/anomalies')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setAnomalies(data) })
      .catch(() => {})
  }, [])

  const confirmAnomaly = (id: string, merchant: string) => {
    logEvent('anomaly_confirmed', { id, merchant })
    setAnomalies(prev => prev.filter(a => a.id !== id))
  }

  const dismissAnomaly = async (id: string, merchant: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_anomaly: false }),
    }).catch(() => {})
    logEvent('anomaly_dismissed', { id, merchant })
    setAnomalies(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => {
    loadData()
    window.addEventListener('data-refresh', loadData)
    return () => window.removeEventListener('data-refresh', loadData)
  }, [loadData])

  return (
    <section id="signal">
      <div className="section-content signal-content">
        <div className="s-left reveal-children">
          <span className="eyebrow">[ SIGNAL ]</span>
          <h2>Anomalies,<br />Surfaced.</h2>
          <p>Unusual patterns detected in real time. Every outlier explained, every risk scored before it reaches your balance.</p>
        </div>
        <div className="s-right reveal-children">
          {anomalies.slice(0, 3).map(a => (
            <div key={a.id}>
              <AlertCard
                merchant={a.merchant}
                amount={typeof a.amount === 'number' ? formatAmount(a.amount) : String(a.amount)}
                date={a.date.includes('-') ? formatDate(a.date) : a.date}
                explanation={a.explanation}
                multiplier={a.multiplier}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', paddingLeft: '2px' }}>
                <button
                  onClick={() => confirmAnomaly(a.id, a.merchant)}
                  style={{ fontSize: '10px', color: 'var(--red)', background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.03em' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => dismissAnomaly(a.id, a.merchant)}
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
