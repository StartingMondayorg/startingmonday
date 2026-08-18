import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { watermarkText } from '@/lib/watermark'
import { PMF_EVENTS } from '@/lib/pmf-event-taxonomy'
import { apiError } from '@/lib/api-error'
import { BriefSaveBodySchema, firstZodError } from '@/lib/schemas'
import {
  PREP_PROVENANCE_VERSION,
  applyAttributionV2,
  buildPrepClaimProvenance,
  type PrepClaimProvenance,
  validatePrepClaimProvenance,
} from '@/lib/prep-provenance'
import { enforcePrepSpecificityGuard } from '@/lib/prep-specificity-guard'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const rawBody = await request.json().catch(() => null)
  const parsedBody = BriefSaveBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return apiError(firstZodError(parsedBody.error), 400)
  }

  const {
    type,
    text,
    company_id,
    contact_id,
    section_name,
    claim_provenance,
    provenance_version,
    attributionContextIds,
  } = parsedBody.data


  const isPrepType = type === 'prep' || type === 'prep_section'
  let validatedClaimProvenance: PrepClaimProvenance[] | null = null
  let persistedText = text

  if (isPrepType) {
    if (!Array.isArray(claim_provenance)) {
      return apiError('Missing claim_provenance for prep brief write', 400)
    }

    if (claim_provenance.length === 0) {
      return apiError('claim_provenance cannot be empty for prep brief write', 400)
    }

    const errors = validatePrepClaimProvenance(claim_provenance)
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid claim_provenance payload', details: errors.slice(0, 3) },
        { status: 400 },
      )
    }

    validatedClaimProvenance = claim_provenance

    if ((provenance_version ?? PREP_PROVENANCE_VERSION) >= 2) {
      const allowedContextIds = attributionContextIds ?? []
      validatedClaimProvenance = applyAttributionV2(validatedClaimProvenance, allowedContextIds)

      const attributionErrors = validatePrepClaimProvenance(validatedClaimProvenance)
      if (attributionErrors.length > 0) {
        return NextResponse.json(
          { error: 'Invalid claim_provenance after attribution v2 normalization', details: attributionErrors.slice(0, 3) },
          { status: 400 },
        )
      }
    }

    const guarded = enforcePrepSpecificityGuard(text, validatedClaimProvenance)
    if (guarded.wasSanitized) {
      persistedText = guarded.text
      validatedClaimProvenance = buildPrepClaimProvenance(guarded.text)

      const postGuardErrors = validatePrepClaimProvenance(validatedClaimProvenance)
      if (postGuardErrors.length > 0) {
        return NextResponse.json(
          { error: 'Invalid claim_provenance after specificity guard', details: postGuardErrors.slice(0, 3) },
          { status: 400 },
        )
      }
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      user_id: userId,
      type,
      output_text: watermarkText(persistedText, userId),
      company_id: company_id ?? null,
      contact_id: contact_id ?? null,
      section_name: section_name ?? null,
      provenance_version: isPrepType ? (provenance_version ?? PREP_PROVENANCE_VERSION) : null,
      claim_provenance: isPrepType ? validatedClaimProvenance : null,
      lifecycle_state: 'generated',
      lifecycle_updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to save brief' }, { status: 500 })
  }

  if (type === 'prep' || type === 'strategy') {
    const eventName = type === 'prep'
      ? PMF_EVENTS.prep.prep_brief_generated
      : 'strategy_brief_generated'
    await logEvent(userId, eventName, { type, company_id: company_id ?? null })
    captureServerEvent(userId, eventName, { type, company_id: company_id ?? null })

    if (type === 'prep') {
      await logEvent(userId, PMF_EVENTS.activation.first_prep_generated, { company_id: company_id ?? null })
      captureServerEvent(userId, PMF_EVENTS.activation.first_prep_generated, { company_id: company_id ?? null })
    }
  }

  return NextResponse.json({ id: data.id })
}
