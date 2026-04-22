import { createClient } from '@/lib/supabase/server'
import { AnomalyRow, detectAnomalies } from '@/lib/anomaly-detection'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json([])

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, merchant, amount, date')
    .eq('user_id', user.id)
    .eq('is_anomaly', true)
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    .lt('amount', 0)
    .order('date', { ascending: false })

  if (error || !transactions?.length) return Response.json([])

  const { data: allRecent } = await supabase
    .from('transactions')
    .select('id, merchant, amount, date')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    .lt('amount', 0)

  const { rows } = detectAnomalies(allRecent ?? [])
  const rowMap = new Map(rows.map(r => [r.id, r]))

  const result: AnomalyRow[] = transactions.map(t => rowMap.get(t.id) ?? {
    id: t.id,
    merchant: t.merchant,
    amount: t.amount,
    date: t.date,
    multiplier: 'Flagged',
    explanation: 'Transaction flagged as anomaly.',
  })

  return Response.json(result)
}
