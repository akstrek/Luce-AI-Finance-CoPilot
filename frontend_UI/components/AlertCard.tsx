interface AlertCardProps {
  merchant: string
  amount: string
  date: string
  explanation: string
  multiplier: string
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff3b3b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L15 14H1Z" />
      <path d="M8 7V10" />
      <circle cx="8" cy="12.5" r="0.8" fill="#ff3b3b" stroke="none" />
    </svg>
  )
}

export default function AlertCard({ merchant, amount, date, explanation, multiplier }: AlertCardProps) {
  return (
    <div className="tile alert-card">
      <div className="ac-r1">
        <WarningIcon />
        <span className="ac-m">{merchant}</span>
        <span className="ac-b">ANOMALY</span>
      </div>
      <div className="ac-r2">
        <span className="ac-v">{amount}</span>
        <span className="ac-d">{date}</span>
      </div>
      <div className="ac-e">{explanation}</div>
      <div className="ac-mul">{multiplier}</div>
    </div>
  )
}
