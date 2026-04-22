import { createClient } from '@/lib/supabase/server'

type Headline = { title: string; source: string; url: string; sentiment?: number | null }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ headlines: [], summary: '' })

  const { data: tickerRows } = await supabase
    .from('portfolio_tickers')
    .select('ticker')
    .eq('user_id', user.id)

  const tickers = (tickerRows ?? []).map((t: { ticker: string }) => t.ticker)

  const headlines: Headline[] = []
  const marketauxKey = process.env.MARKETAUX_API_KEY
  const newsdataKey = process.env.NEWSDATA_API_KEY

  await Promise.allSettled([
    // Marketaux — US/EU market news with sentiment
    (marketauxKey && tickers.length > 0)
      ? fetch(
          `https://api.marketaux.com/v1/news/all?symbols=${tickers.join(',')}&api_token=${marketauxKey}&limit=10&language=en`,
          { next: { revalidate: 1800 } }
        )
          .then(r => r.json())
          .then((d: { data?: Array<{ title: string; url: string; entities?: Array<{ sentiment_score?: number }> }> }) => {
            for (const a of d?.data ?? []) {
              headlines.push({
                title: a.title,
                source: 'Marketaux',
                url: a.url,
                sentiment: a.entities?.[0]?.sentiment_score ?? null,
              })
            }
          })
      : Promise.resolve(),

    // NewsData.io — Indian market (BSE, NSE, RBI, SEBI)
    newsdataKey
      ? fetch(
          `https://newsdata.io/api/1/news?apikey=${newsdataKey}&category=business&country=in&language=en&q=BSE+NSE+RBI+SEBI+${tickers.slice(0, 3).join('+')}`,
          { next: { revalidate: 1800 } }
        )
          .then(r => r.json())
          .then((d: { results?: Array<{ title: string; link: string }> }) => {
            for (const a of d?.results ?? []) {
              headlines.push({ title: a.title, source: 'NewsData', url: a.link })
            }
          })
      : Promise.resolve(),
  ])

  // Insert combined headlines into LightRAG (fire-and-forget)
  const insertUrl = process.env.MODAL_INSERT_URL
  if (insertUrl && headlines.length > 0) {
    const text = headlines.map(h => h.title).join('\n')
    fetch(insertUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, workspace: 'p10_finance' }),
    }).catch(() => {})
  }

  // Synthesise via LightRAG query
  const queryUrl = process.env.MODAL_QUERY_URL ?? process.env.MODAL_LIGHTRAG_QUERY_URL
  let summary = ''
  if (queryUrl && tickers.length > 0) {
    try {
      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `What news is most relevant to a portfolio containing ${tickers.join(', ')} this week?`,
          workspace: 'p10_finance',
        }),
      })
      const d = await res.json()
      summary = d.summary ?? d.answer ?? ''
    } catch {}
  }

  return Response.json({ headlines, summary })
}
