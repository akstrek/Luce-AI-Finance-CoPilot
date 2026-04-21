import MetricTile from '@/components/MetricTile'

export default function PulsePage() {
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
            value="₹42,180"
            sub="vs ₹38,400 forecast"
            barWidth="78%"
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
            value="23.4%"
            sub="+2.1% vs last month"
            barWidth="64%"
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
            value="3 flagged"
            sub="₹8,240 unusual activity"
            barWidth="40%"
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
            value="91.2%"
            sub="Next 30 days"
            barWidth="91%"
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
