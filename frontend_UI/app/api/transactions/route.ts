import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json([])

  const { data } = await supabase
    .from('transactions')
    .select('id, date, merchant, amount, category')
    .eq('user_id', user.id)
    .lt('amount', 0)
    .order('date', { ascending: false })
    .limit(20)

  return Response.json(data ?? [])
}
