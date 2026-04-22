import { createClient } from '@/lib/supabase/server'

interface CategoryForecast {
  category: string
  actual: number
  forecast: number
  bar_pct: number
  overspent: boolean
}

interface TrendMonth {
  month: string
  [category: string]: number | string
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ categories: [], trend: [], insufficient_history: true })

  const { data: summaries, error } = await supabase
    .from('monthly_summaries')
    .select('month, category, total_amount, forecast_next_month')
    .eq('user_id', user.id)
    .order('month', { ascending: false })
    .limit(100)

  if (error || !summaries?.length) {
    return Response.json({ categories: [], trend: [], insufficient_history: true })
  }

  const monthSet = [...new Set(summaries.map(s => s.month))].sort().reverse()
  const [mN, mN1, mN2] = monthSet

  const WEIGHTS = [0.5, 0.3, 0.2]

  const byCategory: Record<string, Record<string, number>> = {}
  for (const s of summaries) {
    if (!byCategory[s.category]) byCategory[s.category] = {}
    byCategory[s.category][s.month] = Number(s.total_amount)
  }

  const categories: CategoryForecast[] = []

  for (const [category, monthAmounts] of Object.entries(byCategory)) {
    const actual = Math.abs(monthAmounts[mN] ?? 0)
    const months = [mN, mN1, mN2].filter(Boolean).map(m => Math.abs(monthAmounts[m] ?? 0))
    const totalWeight = WEIGHTS.slice(0, months.length).reduce((a, b) => a + b, 0)
    const forecast = months.reduce((acc, amt, i) => acc + amt * (WEIGHTS[i] / totalWeight), 0)
    const bar_pct = forecast > 0 ? Math.min(140, Math.round((actual / forecast) * 100)) : 0

    categories.push({
      category,
      actual: Math.round(actual),
      forecast: Math.round(forecast),
      bar_pct,
      overspent: actual > forecast,
    })
  }

  if (mN) {
    const nextMonth = new Date(mN)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthStr = nextMonth.toISOString().split('T')[0].slice(0, 7) + '-01'
    for (const cat of categories) {
      await supabase.from('monthly_summaries').upsert({
        user_id: user.id,
        month: nextMonthStr,
        category: cat.category,
        total_amount: 0,
        forecast_next_month: cat.forecast,
      }, { onConflict: 'user_id,month,category', ignoreDuplicates: false })
    }
  }

  const trendMonths = monthSet.slice(0, 3).reverse()
  const trend: TrendMonth[] = trendMonths.map(m => {
    const entry: TrendMonth = { month: new Date(m).toLocaleString('en-US', { month: 'short' }) }
    for (const [cat, monthAmounts] of Object.entries(byCategory)) {
      entry[cat.toLowerCase()] = Math.abs(monthAmounts[m] ?? 0)
    }
    return entry
  })

  return Response.json({
    categories,
    trend,
    ...(monthSet.length < 2 && { insufficient_history: true }),
  })
}
