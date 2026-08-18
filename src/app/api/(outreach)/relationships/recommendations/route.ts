import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { scoreRelationshipTarget } from '@/lib/relationship-targeting'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

type ContactRow = {
  id: string
  name: string
  title: string | null
  status: string | null
  channel: string | null
  is_priority: boolean | null
  lead_score: number | null
  last_role_discussed: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const companyId = request.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, title, status, channel, is_priority, lead_score, last_role_discussed')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 })
  }

  const ranked = ((data ?? []) as unknown as ContactRow[])
    .map((contact) => {
      const scored = scoreRelationshipTarget({
        title: contact.title,
        status: contact.status,
        channel: contact.channel,
        isPriority: !!contact.is_priority,
        leadScore: contact.lead_score,
        lastRoleDiscussed: contact.last_role_discussed,
      })

      return {
        id: contact.id,
        name: contact.name,
        title: contact.title,
        isRecruiter: scored.isRecruiter,
        relationshipTier: scored.tier,
        relationshipScore: scored.score,
        reasons: scored.reasons,
      }
    })
    .sort((a, b) => b.relationshipScore - a.relationshipScore)

  const tierOneCount = ranked.filter((item) => item.relationshipTier === 'tier_1').length
  const recruiterCount = ranked.filter((item) => item.isRecruiter).length
  const lowConfidence = ranked.filter((item) => item.relationshipScore < 65)

  if (lowConfidence.length > 0) {
    const reviewRows = lowConfidence.slice(0, 10).map((item) => ({
      user_id: userId,
      company_id: companyId,
      contact_id: item.id,
      relationship_score: item.relationshipScore,
      confidence_band: item.relationshipScore >= 55 ? 'medium' : 'low',
    }))

    await supabase.from('relationship_targeting_reviews' as never).insert(reviewRows as never)

    await logEvent(userId, 'relationship_targeting_review_queued', {
      company_id: companyId,
      low_confidence_count: lowConfidence.length,
    })
  }

  const recommendationProps = {
    company_id: companyId,
    recommendation_count: ranked.length,
    tier_1_count: tierOneCount,
    recruiter_count: recruiterCount,
    low_confidence_count: lowConfidence.length,
  }

  await logEvent(userId, 'relationship_recommendations_generated', recommendationProps)
  captureServerEvent(userId, 'relationship_recommendations_generated', recommendationProps)

  return NextResponse.json({
    ok: true,
    companyId,
    recommendations: ranked,
  })
}
