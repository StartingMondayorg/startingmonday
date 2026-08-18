/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

function scorePayload(payload: Record<string, unknown>): { confidence: number; status: 'verified' | 'pending'; evidence: Record<string, boolean> } {
  const fullName = typeof payload.full_name === 'string' && payload.full_name.trim().length > 2
  const email = typeof payload.email === 'string' && payload.email.includes('@')
  const linkedin = typeof payload.linkedin_url === 'string' && payload.linkedin_url.includes('linkedin.com')

  let confidence = 30
  if (fullName) confidence += 25
  if (email) confidence += 30
  if (linkedin) confidence += 20

  return {
    confidence,
    status: confidence >= 80 ? 'verified' : 'pending',
    evidence: {
      full_name: fullName,
      email,
      linkedin_url: linkedin,
    },
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 100), 500))
  const sb = supabase as any

  const { data: submissions } = await sb
    .from('onboarding_intake_submissions')
    .select('id, payload')
    .eq('user_id', auth.userId)
    .eq('status', 'received')
    .order('created_at', { ascending: true })
    .limit(limit)

  let verified = 0
  let needsReview = 0

  for (const submission of submissions ?? []) {
    const payload = (submission.payload ?? {}) as Record<string, unknown>
    const result = scorePayload(payload)

    await sb.from('identity_verification_checks').insert({
      user_id: auth.userId,
      intake_submission_id: submission.id,
      provider: 'internal_rules',
      status: result.status,
      confidence: result.confidence,
      evidence: result.evidence,
      verified_at: result.status === 'verified' ? new Date().toISOString() : null,
    })

    await sb
      .from('onboarding_intake_submissions')
      .update({
        status: result.status === 'verified' ? 'verified' : 'needs_review',
        processed_at: new Date().toISOString(),
      })
      .eq('id', submission.id)
      .eq('user_id', auth.userId)

    if (result.status === 'verified') verified++
    else needsReview++
  }

  return NextResponse.json({ ok: true, processed: submissions?.length ?? 0, verified, needsReview })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
