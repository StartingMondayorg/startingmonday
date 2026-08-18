import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'
import { BriefLifecycleUpdateBodySchema, firstZodError } from '@/lib/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const rawBody = await request.json().catch(() => null)
  const parsedBody = BriefLifecycleUpdateBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return apiError(firstZodError(parsedBody.error), 400)
  }

  const { id } = await params
  const { lifecycle_state } = parsedBody.data
  const now = new Date().toISOString()
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {
    lifecycle_state,
    lifecycle_updated_at: now,
  }

  if (lifecycle_state === 'reviewed') {
    updatePayload.reviewed_at = now
  }

  if (lifecycle_state === 'used') {
    updatePayload.reviewed_at = now
    updatePayload.used_at = now
  }

  const { data, error } = await supabase
    .from('briefs')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', auth.userId)
    .select('id, lifecycle_state, reviewed_at, used_at, lifecycle_updated_at')
    .single()

  if (error || !data) {
    Sentry.captureException(error ?? new Error('brief lifecycle update returned no row'), { extra: { route: 'briefs/[id]/lifecycle', briefId: id, userId: auth.userId } })
    return NextResponse.json({ error: 'Failed to update brief lifecycle' }, { status: 500 })
  }

  return NextResponse.json({ data })
}