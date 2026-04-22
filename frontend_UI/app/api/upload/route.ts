import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 422 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const modalUrl = process.env.MODAL_FILE_PROCESSOR_URL
  if (!modalUrl) return Response.json({ error: 'Modal not configured' }, { status: 503 })

  let result: { count: number; categories: Record<string, number> }
  try {
    const res = await fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, filename: file.name, file_bytes: base64 }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[upload] Modal error', res.status, text)
      return Response.json({ error: 'Processing failed. Please try again.' }, { status: 502 })
    }
    result = await res.json()
  } catch (err) {
    console.error('[upload] Modal unreachable', err)
    return Response.json({ error: 'Processing failed. Please try again.' }, { status: 502 })
  }

  const cookieHeader = { cookie: request.headers.get('cookie') ?? '' }

  // Await both so data is ready before client fires data-refresh
  await Promise.all([
    fetch(`${request.nextUrl.origin}/api/anomalies/detect`, {
      method: 'POST',
      headers: cookieHeader,
    }).catch(() => {}),
    fetch(`${request.nextUrl.origin}/api/forecast`, {
      headers: cookieHeader,
    }).catch(() => {}),
  ])

  return Response.json(result)
}
