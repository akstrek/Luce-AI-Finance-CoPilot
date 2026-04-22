import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: news } = await supabase
    .from('news_cache')
    .select('headline, source, published_at')
    .eq('user_id', user.id)
    .order('published_at', { ascending: false })
    .limit(10)

  const { data: tickers } = await supabase
    .from('portfolio_tickers')
    .select('ticker')
    .eq('user_id', user.id)

  return Response.json({
    headlines: (news ?? []).map(n => ({
      headline: n.headline,
      source: n.source,
      published_at: n.published_at,
    })),
    tickers: (tickers ?? []).map(t => ({ symbol: t.ticker, price_delta: null })),
  })
}
