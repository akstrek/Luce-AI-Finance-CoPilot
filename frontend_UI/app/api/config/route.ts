import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return Response.json({
    llm_model: process.env.NEXT_PUBLIC_LLM_MODEL ?? 'nvidia/nemotron-super-49b-v1:free',
    llm_base_url: process.env.LLM_BASE_URL ?? 'https://openrouter.ai/api/v1',
  })
}
