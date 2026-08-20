import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import {
  ExecutiveEmotionStateScoreRequestSchema,
  scoreExecutiveEmotionState,
} from '@/lib/executive-job-search'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = ExecutiveEmotionStateScoreRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid emotion scoring payload.' }, { status: 400 })
  }

  if (parsed.data.user_id !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden user scope.' }, { status: 403 })
  }

  try {
    const score = scoreExecutiveEmotionState(parsed.data)
    return NextResponse.json(score)
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'executive-transition/emotion-state/score', userId: auth.userId } })
    return NextResponse.json({ error: 'Failed to score emotion state.' }, { status: 500 })
  }
}
