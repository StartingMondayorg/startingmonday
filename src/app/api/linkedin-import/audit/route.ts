/**
 * GET /api/linkedin-import/audit?consent_id=<uuid>&limit=<number>&offset=<number>
 *
 * Returns the audit trail for a specific LinkedIn import consent session.
 * Intended for user-facing "Your data and privacy" transparency views.
 *
 * Query params:
 *   - consent_id (required): import session to retrieve events for
 *   - limit (optional, default 50, max 200)
 *   - offset (optional, default 0)
 *
 * Response: { events: AuditEvent[], total_count: number }
 */

import { type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRelationshipNetworkMatchingEnabled } from '@/lib/feature-flags'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export async function GET(request: NextRequest) {
  if (!isRelationshipNetworkMatchingEnabled()) {
    return Response.json({ error: 'Relationship network matching is currently disabled.' }, { status: 403 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const { searchParams } = new URL(request.url)
  const consentId = searchParams.get('consent_id')
  const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10)

  if (!consentId) {
    return Response.json({ error: 'consent_id is required.' }, { status: 400 })
  }

  const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_LIMIT : rawLimit, MAX_LIMIT)
  const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset

  const supabase = await createClient()

  // Verify consent ownership before returning audit data
  const { data: consent, error: consentError } = await supabase
    .from('linkedin_import_consents')
    .select('id, method, consented_at, revoked_at, data_deleted_at, connection_count')
    .eq('id', consentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (consentError || !consent) {
    return Response.json({ error: 'Import session not found.' }, { status: 404 })
  }

  const { data: events, error: eventsError, count } = await supabase
    .from('linkedin_import_audit_events')
    .select('id, event_type, event_data, occurred_at', { count: 'exact' })
    .eq('user_id', userId)
    .eq('consent_id', consentId)
    .order('occurred_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (eventsError) {
    return Response.json({ error: 'Failed to retrieve audit events.' }, { status: 500 })
  }

  return Response.json({
    consent: {
      id: consent.id,
      method: consent.method,
      consented_at: consent.consented_at,
      revoked_at: consent.revoked_at,
      data_deleted_at: consent.data_deleted_at,
      connection_count: consent.connection_count,
    },
    events: events ?? [],
    total_count: count ?? 0,
    limit,
    offset,
  })
}
