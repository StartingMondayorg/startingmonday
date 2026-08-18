import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackMessage } from '@/lib/slack'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'
  const admin = createAdminClient() as any
  const nowIso = new Date().toISOString()

  let rows: Array<{
    id: string
    user_id: string
    name: string | null
    enrichment_source: string | null
    enrichment_retention_expires_at: string | null
    status?: string | null
  }> | null = null

  let error: { message?: string; code?: string } | null = null

  const primaryQuery = await admin
    .from('contacts')
    .select('id, user_id, name, enrichment_source, enrichment_retention_expires_at, status')
    .in('enrichment_source', ['anthropic', 'fallback'])
    .lte('enrichment_retention_expires_at', nowIso)
    .eq('status', 'active')
    .limit(500)

  rows = primaryQuery.data
  error = primaryQuery.error

  if (error && /column .*status/i.test(error.message ?? '')) {
    const retryQuery = await admin
      .from('contacts')
      .select('id, user_id, name, enrichment_source, enrichment_retention_expires_at')
      .in('enrichment_source', ['anthropic', 'fallback'])
      .lte('enrichment_retention_expires_at', nowIso)
      .limit(500)
    rows = retryQuery.data
    error = retryQuery.error
  }

  if (error && /column .*enrichment_retention_expires_at/i.test(error.message ?? '')) {
    return NextResponse.json({
      ok: true,
      dryRun,
      dueCount: 0,
      archivedCount: 0,
      skipped: true,
      warning: 'contacts.enrichment_retention_expires_at missing; cleanup skipped',
    })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const due = rows ?? []
  if (dryRun || due.length === 0) {
    return NextResponse.json({
      ok: true,
      dryRun,
      dueCount: due.length,
      archivedCount: 0,
    })
  }

  const ids = due.map((row: { id: string }) => row.id)
  let updateError: { message?: string } | null = null

  const primaryUpdate = await admin
    .from('contacts')
    .update({
      status: 'archived',
      enrichment_deleted_at: nowIso,
      updated_at: nowIso,
    })
    .in('id', ids)
  updateError = primaryUpdate.error

  if (updateError && /column .*updated_at/i.test(updateError.message ?? '')) {
    const retryUpdate = await admin
      .from('contacts')
      .update({
        status: 'archived',
        enrichment_deleted_at: nowIso,
      })
      .in('id', ids)
    updateError = retryUpdate.error
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await sendSlackMessage({
    text: [
      '*Enrichment retention cleanup complete*',
      `- Archived contacts: ${ids.length}`,
      '- Sources: anthropic, fallback',
      `- Timestamp: ${nowIso}`,
    ].join('\n'),
  })

  return NextResponse.json({
    ok: true,
    dryRun: false,
    dueCount: due.length,
    archivedCount: ids.length,
  })
}
