import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/require-auth'
import { withApiTelemetry } from '@/lib/telemetry'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { NextRequest, NextResponse } from 'next/server'

async function postHandler(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const supabase = await createClient()

  try {
    const body = await req.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const title = typeof body?.title === 'string' ? body.title.trim() || null : null
    const firm = typeof body?.firm === 'string' ? body.firm.trim() || null : null
    const channel = typeof body?.channel === 'string' ? body.channel.trim() || null : null
    const email = typeof body?.email === 'string' ? body.email.trim() || null : null
    const linkedinUrl = typeof body?.linkedin_url === 'string' ? body.linkedin_url.trim() || null : null
    const notes = typeof body?.notes === 'string' ? body.notes.trim() || null : null
    const status = typeof body?.status === 'string' && body.status.trim() ? body.status.trim() : 'active'
    const companyId = typeof body?.company_id === 'string' && body.company_id.trim() ? body.company_id.trim() : null
    const source = typeof body?.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 64) : 'manual'
    const enrichmentSource = typeof body?.enrichment_source === 'string' && body.enrichment_source.trim()
      ? body.enrichment_source.trim().slice(0, 32)
      : 'manual'
    const enrichmentConfidence = typeof body?.enrichment_confidence === 'number'
      ? Math.max(0, Math.min(0.999, body.enrichment_confidence))
      : null
    const retentionDays = typeof body?.enrichment_retention_days === 'number' && Number.isFinite(body.enrichment_retention_days)
      ? Math.max(1, Math.min(365, Math.round(body.enrichment_retention_days)))
      : null
    const retentionExpiry = retentionDays && enrichmentSource !== 'manual'
      ? new Date(Date.now() + retentionDays * 86400_000).toISOString()
      : null

    if (companyId) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .eq('user_id', auth.userId)
        .maybeSingle()

      if (companyError) {
        return NextResponse.json({ error: 'Failed to verify company' }, { status: 500 })
      }

      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: auth.userId,
        company_id: companyId,
        name,
        title,
        firm,
        channel,
        email,
        linkedin_url: linkedinUrl,
        notes,
        status,
        enrichment_source: enrichmentSource,
        enrichment_confidence: enrichmentConfidence,
        enrichment_retention_expires_at: retentionExpiry,
      })
      .select('id, name, title, firm, channel, email, linkedin_url, notes, company_id, status, contacted_at, follow_up_at')
      .single()

    if (error) {
      console.error('[contacts] create error:', error)
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    await logEvent(auth.userId, 'contact_added', {
      source,
      enrichment_source: enrichmentSource,
      has_company_id: !!companyId,
    })
    captureServerEvent(auth.userId, 'contact_added', {
      source,
      enrichment_source: enrichmentSource,
      has_company_id: !!companyId,
    })

    if (source === 'discover_recommendation_contact' || source === 'discover_recommendation_outreach') {
      const recommendationAddedProps = {
        source,
        contact_id: data.id,
        enrichment_source: enrichmentSource,
        mode: 'dashboard_discover',
        confidence_band: 'medium',
        action_context: 'discover_recommendation_action',
      }
      await logEvent(auth.userId, 'discover_recommendation_added', recommendationAddedProps)
      captureServerEvent(auth.userId, 'discover_recommendation_added', recommendationAddedProps)
    }

    if (source === 'discover_recommendation_outreach') {
      const outreachStartedProps = {
        source,
        contact_id: data.id,
        enrichment_source: enrichmentSource,
        mode: 'dashboard_discover',
        confidence_band: 'medium',
        action_context: 'discover_recommendation_outreach_start',
      }
      await logEvent(auth.userId, 'discover_outreach_started', outreachStartedProps)
      captureServerEvent(auth.userId, 'discover_outreach_started', outreachStartedProps)
    }

    return NextResponse.json({ id: data.id, contact: data }, { status: 201 })
  } catch (error) {
    console.error('[contacts] create exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withApiTelemetry('/api/contacts', postHandler)