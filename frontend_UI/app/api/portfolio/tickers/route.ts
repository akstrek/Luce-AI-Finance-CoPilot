import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json([])

  const { data } = await supabase
    .from('portfolio_tickers')
    .select('ticker')
    .eq('user_id', user.id)
    .order('ticker')

  return Response.json((data ?? []).map((r: { ticker: string }) => r.ticker))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker } = await request.json()
  if (!ticker?.trim()) return Response.json({ error: 'Ticker is required' }, { status: 422 })

  const { error } = await supabase
    .from('portfolio_tickers')
    .insert({ user_id: user.id, ticker: ticker.trim().toUpperCase() })

  if (error) return Response.json({ error: error.message }, { status: 409 })
  return Response.json({ ticker: ticker.trim().toUpperCase() }, { status: 201 })
}
