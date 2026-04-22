import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(null, { status: 204 })

  const { event_name, metadata } = await request.json()
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_name: String(event_name ?? ''),
    metadata: metadata ?? null,
  }).then(() => {}, () => {})

  return new Response(null, { status: 204 })
}
