import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'

export const runtime = 'nodejs'

type RequestBody = {
  password?: unknown
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return withAuthCookies(
      NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 }),
      auth
    )
  }

  const password = typeof body.password === 'string' ? body.password : ''

  if (password.length < 8) {
    return withAuthCookies(
      NextResponse.json(
        { ok: false, error: 'Password must be at least 8 characters.' },
        { status: 400 }
      ),
      auth
    )
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return withAuthCookies(
        NextResponse.json({ ok: false, error: error.message }, { status: 400 }),
        auth
      )
    }

    return withAuthCookies(
      NextResponse.json(
        {
          ok: true,
          message: 'Password saved. You can now sign in with either email/password or your provider.',
        },
        { status: 200 }
      ),
      auth
    )
  } catch (error) {
    console.error('Set password error:', error)
    return withAuthCookies(
      NextResponse.json({ ok: false, error: 'Failed to set password' }, { status: 500 }),
      auth
    )
  }
}