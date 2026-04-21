import React from 'react'

interface MetricTileProps {
  icon: React.ReactNode
  label: string
  number: string
  value: string
  sub: string
  barWidth: string
  barColor: string
  alert?: boolean
}

export default function MetricTile({ icon, label, number, value, sub, barWidth, barColor, alert }: MetricTileProps) {
  return (
    <div
      className={`tile metric-tile${alert ? ' m-alert' : ''}`}
      style={alert ? { transition: 'border-color .35s,box-shadow .35s,transform .35s' } : {}}
    >
      <div className="m-row1">
        {icon}
        <span className="m-lbl">{label}</span>
        <span style={{ marginLeft: 'auto' }} className="tile-number">{number}</span>
      </div>
      <div className="m-val">{value}</div>
      <div className="m-sub">{sub}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ '--target-width': barWidth, background: barColor } as React.CSSProperties} />
      </div>
    </div>
  )
}
