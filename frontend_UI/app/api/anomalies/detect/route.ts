import { createClient } from '@/lib/supabase/server'
import { detectAnomalies } from '@/lib/anomaly-detection'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, merchant, amount, date')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    .lt('amount', 0)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!transactions?.length) return Response.json([])

  const { flaggedIds, rows } = detectAnomalies(transactions)

  // Clear all existing anomaly flags then set new ones
  await supabase
    .from('transactions')
    .update({ is_anomaly: false })
    .eq('user_id', user.id)
    .lt('amount', 0)
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])

  if (flaggedIds.size > 0) {
    await supabase
      .from('transactions')
      .update({ is_anomaly: true })
      .in('id', [...flaggedIds])
  }

  return Response.json(rows)
}
