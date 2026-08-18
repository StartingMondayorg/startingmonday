import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reference_companies')
    .select('id, slug, name, description, hq_location, industries, cb_rank')
    .ilike('name', `%${q}%`)
    .order('cb_rank', { ascending: true })
    .limit(10)

  if (error) return NextResponse.json([], { status: 500 })

  return NextResponse.json(data ?? [])
}
