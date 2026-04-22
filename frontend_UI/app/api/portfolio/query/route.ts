import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { query } = await request.json()
  if (!query?.trim()) return Response.json({ error: 'Query is required' }, { status: 422 })

  // Save query to nexus_queries
  await supabase.from('nexus_queries').insert({ user_id: user.id, query })

  // Get user's tickers and recent merchants
  const { data: tickers } = await supabase
    .from('portfolio_tickers')
    .select('ticker')
    .eq('user_id', user.id)

  const { data: recentTxns } = await supabase
    .from('transactions')
    .select('merchant, amount')
    .eq('user_id', user.id)
    .lt('amount', 0)
    .order('created_at', { ascending: false })
    .limit(50)

  // Top merchants by spend
  const merchantSpend: Record<string, number> = {}
  for (const t of recentTxns ?? []) {
    merchantSpend[t.merchant] = (merchantSpend[t.merchant] ?? 0) + Math.abs(t.amount)
  }
  const topMerchants = Object.entries(merchantSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m]) => m)

  const modalUrl = process.env.MODAL_LIGHTRAG_QUERY_URL
  if (!modalUrl) {
    return Response.json({
      summary: 'LightRAG is not yet configured. Deploy the Modal backend first.',
      sources: [],
      raw_context: '',
    })
  }

  try {
    const res = await fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        query,
        tickers: (tickers ?? []).map(t => t.ticker),
        recent_merchants: topMerchants,
      }),
    })
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'LightRAG query failed' }, { status: 502 })
  }
}
