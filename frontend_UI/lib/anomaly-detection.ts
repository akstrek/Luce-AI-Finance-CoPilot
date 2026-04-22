export interface AnomalyRow {
  id: string
  merchant: string
  amount: number
  date: string
  multiplier: string
  explanation: string
}

interface Transaction {
  id: string
  merchant: string
  amount: number
  date: string
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function stddev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

export function detectAnomalies(transactions: Transaction[]): {
  flaggedIds: Set<string>
  rows: AnomalyRow[]
} {
  // Group absolute amounts by merchant
  const merchantHistory: Record<string, number[]> = {}
  for (const t of transactions) {
    const abs = Math.abs(t.amount)
    if (!merchantHistory[t.merchant]) merchantHistory[t.merchant] = []
    merchantHistory[t.merchant].push(abs)
  }

  const flaggedIds = new Set<string>()
  const rows: AnomalyRow[] = []

  for (const t of transactions) {
    const abs = Math.abs(t.amount)
    const history = merchantHistory[t.merchant] ?? []

    if (history.length === 1) {
      flaggedIds.add(t.id)
      rows.push({
        id: t.id,
        merchant: t.merchant,
        amount: t.amount,
        date: t.date,
        multiplier: 'First transaction detected',
        explanation: 'No historical match. New payee — manual review recommended.',
      })
      continue
    }

    const med = median(history)
    const sigma = stddev(history)
    const threshold = med + 2 * sigma

    if (abs > threshold) {
      const mean = history.reduce((a, b) => a + b, 0) / history.length
      const mult = (abs / mean).toFixed(1)
      flaggedIds.add(t.id)
      rows.push({
        id: t.id,
        merchant: t.merchant,
        amount: t.amount,
        date: t.date,
        multiplier: `${mult}× your monthly average`,
        explanation: `${t.merchant} spend ${mult}× above your 90-day average.`,
      })
    }
  }

  return { flaggedIds, rows }
}
