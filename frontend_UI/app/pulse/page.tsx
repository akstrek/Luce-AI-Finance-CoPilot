'use client'
import { useEffect, useState, useCallback } from 'react'
import MetricTile from '@/components/MetricTile'

interface Metrics {
  monthlySpend: number
  forecast: number
  savingsRate: number
  savingsDelta: number
  anomalyCount: number
  anomalySum: number
  forecastAccuracy: number
}

const FALLBACK: Metrics = {
  monthlySpend: 42180,
  forecast: 38400,
  savingsRate: 23.4,
  savingsDelta: 2.1,
  anomalyCount: 3,
  anomalySum: 8240,
  forecastAccuracy: 91.2,
}

export default function PulsePage() {
  const [metrics, setMetrics] = useState<Metrics>(FALLBACK)

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/anomalies').then(r => r.json()).catch(() => []),
      fetch('/api/forecast').then(r => r.json()).catch(() => ({ categories: [] })),
    ]).then(([anomalies, forecastData]) => {
      const anomalyCount = Array.isArray(anomalies) ? anomalies.length : 0
      const anomalySum = Array.isArray(anomalies)
        ? anomalies.reduce((s: number, a: { amount: number }) => s + Math.abs(a.amount), 0)
        : 0

      const cats: { actual: number; forecast: number }[] = forecastData.categories ?? []
      const totalActual = cats.reduce((s, c) => s + c.actual, 0)
      const totalForecast = cats.reduce((s, c) => s + c.forecast, 0)

      // Forecast accuracy: 100 - MAPE across categories where forecast > 0
      const mapeItems = cats.filter(c => c.forecast > 0)
      const mape = mapeItems.length > 0
        ? mapeItems.reduce((s, c) => s + Math.abs((c.actual - c.forecast) / c.forecast), 0) / mapeItems.length * 100
        : 8.8
      const forecastAccuracy = Math.max(0, Math.min(100, 100 - mape))

      setMetrics(prev => ({
        ...prev,
        monthlySpend: totalActual > 0 ? totalActual : prev.monthlySpend,
        forecast: totalForecast > 0 ? totalForecast : prev.forecast,
        anomalyCount: anomalyCount > 0 ? anomalyCount : (anomalies.length === 0 ? 0 : prev.anomalyCount),
        anomalySum,
        forecastAccuracy: mapeItems.length > 0 ? Math.round(forecastAccuracy * 10) / 10 : prev.forecastAccuracy,
      }))
    })
  }, [])

  useEffect(() => {
    loadData()
    window.addEventListener('data-refresh', loadData)
    return () => window.removeEventListener('data-refresh', loadData)
  }, [loadData])

  const spendBarPct = metrics.forecast > 0
    ? Math.min(100, Math.round((metrics.monthlySpend / metrics.forecast) * 100))
    : 78

  return (
    <section id="pulse">
      <div className="section-content pulse-content">
        <div className="reveal-children" style={{ textAlign: 'center' }}>
          <span className="eyebrow">[ PULSE ]</span>
          <h2>Your Financial Pulse</h2>
        </div>
        <div className="p-grid">
          <MetricTile
            number="[ 1.0 ]"
            label="MONTHLY SPEND"
            value={`₹${metrics.monthlySpend.toLocaleString('en-IN')}`}
            sub={`vs ₹${metrics.forecast.toLocaleString('en-IN')} forecast`}
            barWidth={`${spendBarPct}%`}
            barColor="var(--accent)"
            icon={
              <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="10" cy="10" r="7.5" />
                <path d="M7 13L13 7M13 7H9M13 7V11" />
              </svg>
            }
          />
          <MetricTile
            number="[ 2.0 ]"
            label="SAVINGS RATE"
            value={`${metrics.savingsRate}%`}
            sub={`${metrics.savingsDelta >= 0 ? '+' : ''}${metrics.savingsDelta}% vs last month`}
            barWidth={`${Math.round(metrics.savingsRate)}%`}
            barColor="var(--accent)"
            icon={
              <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 1.5L3.5 5.5V10.5C3.5 14 10 17 10 17S16.5 14 16.5 10.5V5.5Z" />
                <path d="M7 10L9 12L13 8" />
              </svg>
            }
          />
          <MetricTile
            number="[ 3.0 ]"
            label="ANOMALIES"
            value={`${metrics.anomalyCount} flagged`}
            sub={`₹${metrics.anomalySum.toLocaleString('en-IN')} unusual activity`}
            barWidth={`${Math.min(100, metrics.anomalyCount * 10)}%`}
            barColor="var(--red)"
            alert
            icon={
              <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 10L5.5 4L9 10L12.5 4L16 10" />
                <circle cx="5.5" cy="4" r="1" fill="#00ff50" stroke="none" />
                <circle cx="12.5" cy="4" r="1" fill="#00ff50" stroke="none" />
              </svg>
            }
          />
          <MetricTile
            number="[ 4.0 ]"
            label="FORECAST ACCURACY"
            value={`${metrics.forecastAccuracy}%`}
            sub="Next 30 days"
            barWidth={`${Math.round(metrics.forecastAccuracy)}%`}
            barColor="var(--accent)"
            icon={
              <svg width="20" height="20" stroke="var(--accent)" fill="none" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="3" width="14" height="13" rx="2" />
                <path d="M6 3V1M12 3V1M2 7H16" />
                <path d="M11 12H15M15 12L13 10M15 12L13 14" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  )
}
