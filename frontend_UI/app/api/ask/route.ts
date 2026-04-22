import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const question: string = body?.question?.trim() ?? ''
  if (!question) return Response.json({ error: 'Question is required' }, { status: 422 })

  // Log to nexus_queries (non-blocking insert)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    supabase.from('nexus_queries').insert({ user_id: user.id, query: question }).then(() => {}, () => {})
  }

  const queryUrl = process.env.MODAL_QUERY_URL ?? process.env.MODAL_LIGHTRAG_QUERY_URL
  if (!queryUrl) return Response.json({ answer: 'AI backend not configured.' })

  try {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, workspace: 'p10_finance' }),
    })
    if (!res.ok) return Response.json({ error: 'Query failed' }, { status: 502 })
    const d = await res.json()
    return Response.json({ answer: d.summary ?? d.answer ?? 'No answer returned.' })
  } catch {
    return Response.json({ error: 'Query failed' }, { status: 502 })
  }
}
