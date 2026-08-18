import { createAdminClient } from '@/lib/supabase/admin'
import { routeLead, scoreLead } from '@/lib/intelligence/lead-scoring'

export type LeadScoringOptions = {
  limit?: number
  userId?: string
  dryRun?: boolean
  trigger?: 'admin' | 'cron'
  initiatedByUserId?: string | null
}

export type LeadScoringResult = {
  processed: number
  updated: number
  dryRun: boolean
  routed: Record<'hot' | 'warm' | 'nurture', number>
  byChannel: Record<string, number>
}

export async function runLeadScoringPass(options: LeadScoringOptions): Promise<LeadScoringResult> {
  const queryLimit = Number(options.limit ?? 500)
  const limit = Number.isFinite(queryLimit) ? Math.max(1, Math.min(queryLimit, 5000)) : 500
  const userId = options.userId
  const dryRun = options.dryRun === true
  const trigger = options.trigger ?? 'admin'
  const initiatedByUserId = options.initiatedByUserId ?? null

  const admin = createAdminClient() as any
  let query = admin
    .from('contacts')
    .select('id, user_id, title, channel, status, outreach_status, is_priority, email, linkedin_url, notes, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (userId) query = query.eq('user_id', userId)

  const { data: contacts, error: loadError } = await query
  if (loadError) {
    await admin
      .from('lead_scoring_runs')
      .insert({
        initiated_by_user_id: initiatedByUserId,
        trigger,
        status: 'failed',
        dry_run: dryRun,
        error_message: loadError.message,
      })
    throw new Error(loadError.message)
  }

  const rows = contacts ?? []
  let updated = 0
  const routed: Record<'hot' | 'warm' | 'nurture', number> = { hot: 0, warm: 0, nurture: 0 }
  const byChannel: Record<string, number> = {}

  for (const contact of rows) {
    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(contact.created_at).getTime()) / 86_400_000))
    const { score, reasons } = scoreLead({
      title: contact.title,
      channel: contact.channel,
      outreachStatus: contact.outreach_status,
      isPriority: contact.is_priority,
      hasEmail: !!contact.email,
      hasLinkedIn: !!contact.linkedin_url,
      hasNotes: !!contact.notes,
      leadAgeDays: ageDays,
      status: contact.status,
    })
    const routing = routeLead(score)

    routed[routing.queue] += 1
    const channelKey = (contact.channel ?? 'unknown').toLowerCase()
    byChannel[channelKey] = (byChannel[channelKey] ?? 0) + 1

    if (!dryRun) {
      const { error: updateError } = await admin
        .from('contacts')
        .update({
          lead_score: score,
          lead_tier: routing.tier,
          lead_queue: routing.queue,
          lead_score_reasons: reasons,
          lead_scored_at: new Date().toISOString(),
          lead_routed_at: new Date().toISOString(),
        })
        .eq('id', contact.id)

      if (!updateError) {
        updated += 1
      }
    }
  }

  const result = {
    processed: rows.length,
    updated: dryRun ? 0 : updated,
    dryRun,
    routed,
    byChannel,
  }

  await admin
    .from('lead_scoring_runs')
    .insert({
      initiated_by_user_id: initiatedByUserId,
      trigger,
      status: 'success',
      processed: result.processed,
      updated: result.updated,
      dry_run: result.dryRun,
      routed: result.routed,
      by_channel: result.byChannel,
    })

  return result
}
