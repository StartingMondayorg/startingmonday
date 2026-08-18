import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('invite_code')
    .eq('user_id', userId)
    .single()

  let code = profile?.invite_code

  if (!code) {
    code = randomBytes(16).toString('hex')
    await supabase
      .from('user_profiles')
      .update({ invite_code: code })
      .eq('user_id', userId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'

  return NextResponse.json({ code, url: `${appUrl}/invite/${code}` })
}
