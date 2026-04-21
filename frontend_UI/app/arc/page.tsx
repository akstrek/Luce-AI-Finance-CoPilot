'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const chartData = [
  { month: 'Feb', food: 7800, shopping: 6900, transport: 3200 },
  { month: 'Mar', food: 8100, shopping: 9400, transport: 2900 },
  { month: 'Apr', food: 8420, shopping: 11200, transport: 3180 }
]

export default function ArcPage() {
  return (
    <section id="arc">
      <div className="section-content arc-content">
        <div className="a-left reveal-children">
          <span className="eyebrow">[ ARC ]</span>
          <h2>Your Spend,<br />Forecasted.</h2>
          <p>Five categories. Actual vs predicted. The Shopping overspend is real.</p>
          <div className="cat-bars">
            <div className="cat-row">
              <div className="c-head">
                <span className="c-name">Food &amp; Dining</span>
                <span className="c-amt">₹8,420 <span className="c-fcst">/ ₹9,000</span></span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ '--target-width': '93%', background: 'var(--accent)' } as React.CSSProperties} />
                <div className="bf-m" style={{ left: '100%' }} />
              </div>
            </div>
            <div className="cat-row">
              <div className="c-head">
                <span className="c-name">Transport</span>
                <span className="c-amt">₹3,180 <span className="c-fcst">/ ₹3,500</span></span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ '--target-width': '91%', background: 'var(--accent)' } as React.CSSProperties} />
                <div className="bf-m" style={{ left: '100%' }} />
              </div>
            </div>
            <div className="cat-row">
              <div className="c-head">
                <span className="c-name">Shopping</span>
                <span className="c-amt">₹11,200 <span className="c-fcst">/ ₹8,000</span></span>
              </div>
              <div className="bar-track">
                <div className="bar-fill overspent" style={{ '--target-width': '100%' } as React.CSSProperties} />
                <div className="bf-m" style={{ left: '71%' }} />
              </div>
            </div>
            <div className="cat-row">
              <div className="c-head">
                <span className="c-name">Bills &amp; Utilities</span>
                <span className="c-amt">₹4,960 <span className="c-fcst">/ ₹5,000</span></span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ '--target-width': '99%', background: 'var(--accent)' } as React.CSSProperties} />
                <div className="bf-m" style={{ left: '100%' }} />
              </div>
            </div>
            <div className="cat-row">
              <div className="c-head">
                <span className="c-name">Entertainment</span>
                <span className="c-amt">₹2,100 <span className="c-fcst">/ ₹3,000</span></span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ '--target-width': '70%', background: 'var(--accent)' } as React.CSSProperties} />
                <div className="bf-m" style={{ left: '100%' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="a-right reveal-children">
          <h3>3-Month Trend</h3>
          <p className="a-r-sub">Category spend over time</p>
          <div id="trend-chart" style={{ width: '100%', height: '240px', marginTop: '12px', overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide={true} />
                <Tooltip contentStyle={{ background: 'rgba(10,20,10,0.95)', border: '1px solid rgba(0,255,80,0.18)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: 11, color: 'white' }} />
                <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.5)', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="food" name="Food" stroke="#00ff50" strokeWidth={2} dot={{ r: 3, fill: '#00ff50', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="shopping" name="Shopping" stroke="#00ccff" strokeWidth={2} dot={{ r: 3, fill: '#00ccff', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="transport" name="Transport" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} dot={{ r: 3, fill: 'rgba(255,255,255,0.45)', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
