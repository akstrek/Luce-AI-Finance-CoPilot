'use client'
import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { logEvent } from '@/lib/log-event'

interface CategoryForecast {
  category: string
  actual: number
  forecast: number
  bar_pct: number
  overspent: boolean
}

interface TrendMonth {
  month: string
  [key: string]: number | string
}

const FALLBACK_CATS: CategoryForecast[] = [
  { category: 'Food & Dining', actual: 8420, forecast: 9000, bar_pct: 93, overspent: false },
  { category: 'Transport', actual: 3180, forecast: 3500, bar_pct: 91, overspent: false },
  { category: 'Shopping', actual: 11200, forecast: 8000, bar_pct: 140, overspent: true },
  { category: 'Bills & Utilities', actual: 4960, forecast: 5000, bar_pct: 99, overspent: false },
  { category: 'Entertainment', actual: 2100, forecast: 3000, bar_pct: 70, overspent: false },
]

const FALLBACK_TREND = [
  { month: 'Feb', food: 7800, shopping: 6900, transport: 3200 },
  { month: 'Mar', food: 8100, shopping: 9400, transport: 2900 },
  { month: 'Apr', food: 8420, shopping: 11200, transport: 3180 },
]

const LINE_COLORS = ['#00ff50', '#00ccff', 'rgba(255,255,255,0.45)', '#ff9900', '#ff3b3b']
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']

interface TxRow { id: string; date: string; merchant: string; amount: number; category: string | null }

export default function ArcPage() {
  const [categories, setCategories] = useState<CategoryForecast[]>(FALLBACK_CATS)
  const [trend, setTrend] = useState<TrendMonth[]>(FALLBACK_TREND)
  const [transactions, setTransactions] = useState<TxRow[]>([])

  const loadData = useCallback(() => {
    fetch('/api/forecast')
      .then(r => r.json())
      .then(data => {
        if (data.categories?.length > 0) setCategories(data.categories)
        if (data.trend?.length > 0) setTrend(data.trend)
      })
      .catch(() => {})
    fetch('/api/transactions')
      .then(r => r.json())
      .then((data: TxRow[]) => { if (Array.isArray(data)) setTransactions(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
    window.addEventListener('data-refresh', loadData)
    return () => window.removeEventListener('data-refresh', loadData)
  }, [loadData])

  const correctCategory = async (id: string, oldCat: string | null, newCat: string) => {
    if (newCat === (oldCat ?? 'Other')) return
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCat }),
    }).catch(() => {})
    logEvent('manually_corrected', { id, old_category: oldCat, new_category: newCat })
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: newCat } : t))
  }

  const trendKeys = trend.length > 0
    ? Object.keys(trend[0]).filter(k => k !== 'month')
    : []

  return (
    <section id="arc">
      <div className="section-content arc-content">
        <div className="a-left reveal-children">
          <span className="eyebrow">[ ARC ]</span>
          <h2>Your Spend,<br />Forecasted.</h2>
          <p>Five categories. Actual vs predicted. The Shopping overspend is real.</p>
          <div className="cat-bars">
            {categories.map(cat => (
              <div className="cat-row" key={cat.category}>
                <div className="c-head">
                  <span className="c-name">{cat.category}</span>
                  <span className="c-amt">
                    ₹{cat.actual.toLocaleString('en-IN')}
                    {' '}<span className="c-fcst">/ ₹{cat.forecast.toLocaleString('en-IN')}</span>
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill${cat.overspent ? ' overspent' : ''}`}
                    style={{
                      '--target-width': `${Math.min(cat.bar_pct, 100)}%`,
                      ...(!cat.overspent && { background: 'var(--accent)' }),
                    } as React.CSSProperties}
                  />
                  {!cat.overspent && <div className="bf-m" style={{ left: '100%' }} />}
                  {cat.overspent && <div className="bf-m" style={{ left: `${Math.round((cat.forecast / cat.actual) * 100)}%` }} />}
                </div>
              </div>
            ))}
          </div>

          {transactions.length > 0 && (
            <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Correct Categories</div>
              {transactions.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, fontSize: '11px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.merchant}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>₹{Math.abs(t.amount).toLocaleString('en-IN')}</div>
                  <select
                    value={t.category ?? 'Other'}
                    onChange={e => correctCategory(t.id, t.category, e.target.value)}
                    style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'rgba(0,255,80,0.7)', padding: '3px 6px', cursor: 'pointer', outline: 'none' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#020402' }}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="a-right reveal-children">
          <h3>3-Month Trend</h3>
          <p className="a-r-sub">Category spend over time</p>
          <div id="trend-chart" style={{ width: '100%', height: '240px', marginTop: '12px', overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide={true} />
                <Tooltip contentStyle={{ background: 'rgba(10,20,10,0.95)', border: '1px solid rgba(0,255,80,0.18)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: 11, color: 'white' }} />
                <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.5)', paddingTop: '8px' }} />
                {trendKeys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key.charAt(0).toUpperCase() + key.slice(1)}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={i === 0 ? 2 : i === 1 ? 2 : 1.5}
                    dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
