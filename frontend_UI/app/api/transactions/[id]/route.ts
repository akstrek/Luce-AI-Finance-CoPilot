import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const ALLOWED: Set<string> = new Set(['category', 'is_anomaly'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED.has(key)) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields' }, { status: 422 })
  }

  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
