 
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type PartnerRow = {
  id: string
  name: string
  email: string
  is_active: boolean
  notes: string | null
}

type ExportRunRow = {
  id: string
  review_payload: {
    partner_id?: string
    partner_name?: string
    month_key?: string
    formats?: {
      csv?: { file_name?: string; content?: string }
      pdf?: { file_name?: string; html?: string }
    }
  } | null
}

type SponsorSendConfig = {
  enabled: boolean
  cadence: 'monthly'
  dayOfMonth: number
  hourUtc: number
  recipients: string[]
  maxRetries: number
}

const requestSchema = z.object({
  referenceDate: z.string().optional(),
  sendLive: z.boolean().optional(),
  forceSend: z.boolean().optional(),
})

function monthKey(referenceDate?: string): string {
  const date = referenceDate ? new Date(referenceDate) : new Date()
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function parseSendConfig(notes: string | null, fallbackRecipient: string): SponsorSendConfig {
  const defaults: SponsorSendConfig = {
    enabled: true,
    cadence: 'monthly',
    dayOfMonth: 1,
    hourUtc: 9,
    recipients: isValidEmail(fallbackRecipient) ? [fallbackRecipient] : [],
    maxRetries: 1,
  }

  if (!notes) return defaults
  const marker = 'SPONSOR_SEND_CONFIG:'
  const markerIndex = notes.indexOf(marker)
  if (markerIndex === -1) return defaults

  const raw = notes.slice(markerIndex + marker.length).trim()
  if (!raw) return defaults

  try {
    const parsed = JSON.parse(raw) as Partial<SponsorSendConfig>
    const recipients = Array.isArray(parsed.recipients)
      ? parsed.recipients.filter((item): item is string => typeof item === 'string' && isValidEmail(item.trim())).map((item) => item.trim())
      : defaults.recipients

    return {
      enabled: parsed.enabled ?? defaults.enabled,
      cadence: 'monthly',
      dayOfMonth: Number.isFinite(parsed.dayOfMonth) ? Math.min(28, Math.max(1, Number(parsed.dayOfMonth))) : defaults.dayOfMonth,
      hourUtc: Number.isFinite(parsed.hourUtc) ? Math.min(23, Math.max(0, Number(parsed.hourUtc))) : defaults.hourUtc,
      recipients,
      maxRetries: Number.isFinite(parsed.maxRetries) ? Math.min(3, Math.max(0, Number(parsed.maxRetries))) : defaults.maxRetries,
    }
  } catch {
    return defaults
  }
}

function shouldSendNow(config: SponsorSendConfig, now: Date): boolean {
  if (!config.enabled) return false
  return now.getUTCDate() === config.dayOfMonth && now.getUTCHours() >= config.hourUtc
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsedBody = await parseAutomationBody(request, requestSchema)
    if (!parsedBody.ok) return parsedBody.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const body = parsedBody.body
    const key = monthKey(body.referenceDate)
    const sendLive = body.sendLive === true
    const forceSend = body.forceSend === true
    const now = new Date()

    const [partnersRes, exportsRes] = await Promise.all([
      sb
        .from('partners')
        .select('id,name,email,is_active,notes')
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      sb
        .from('monthly_business_review_runs')
        .select('id,review_payload')
        .eq('month_key', key)
        .order('created_at', { ascending: false }),
    ])

    const partners = (partnersRes.data ?? []) as PartnerRow[]
    const exportRows = (exportsRes.data ?? []) as ExportRunRow[]

    const latestExportByPartner = new Map<string, ExportRunRow>()
    for (const row of exportRows) {
      const partnerId = row.review_payload?.partner_id
      if (!partnerId || latestExportByPartner.has(partnerId)) continue
      latestExportByPartner.set(partnerId, row)
    }

    const deliveryLogs: Array<Record<string, unknown>> = []
    let activeCycles = 0
    let successfulCycles = 0

    for (const partner of partners) {
      const config = parseSendConfig(partner.notes, partner.email)
      const due = forceSend || shouldSendNow(config, now)
      if (!config.enabled || !due) continue

      activeCycles += 1
      const exportRun = latestExportByPartner.get(partner.id)
      const recipients = config.recipients

      let attempts = 0
      let sent = false
      let retryStatus: 'none' | 'scheduled' | 'succeeded' | 'failed' = 'none'
      const recipientResults: Array<{ recipient: string; result: 'sent' | 'failed'; error: string | null; attempted_at: string }> = []

      const maxAttempts = Math.max(1, config.maxRetries + 1)
      while (attempts < maxAttempts && !sent) {
        attempts += 1

        if (!exportRun) {
          retryStatus = attempts < maxAttempts ? 'scheduled' : 'failed'
          continue
        }

        if (recipients.length === 0) {
          retryStatus = attempts < maxAttempts ? 'scheduled' : 'failed'
          continue
        }

        let attemptFailed = false
        for (const recipient of recipients) {
          if (!sendLive) {
            recipientResults.push({
              recipient,
              result: 'sent',
              error: null,
              attempted_at: new Date().toISOString(),
            })
            continue
          }

          const subject = `Sponsor report pack ${key} - ${partner.name}`
          const payload = exportRun.review_payload ?? {}
          const csvFile = payload.formats?.csv?.file_name ?? `sponsor-pack-${partner.id}-${key}.csv`
          const pdfFile = payload.formats?.pdf?.file_name ?? `sponsor-pack-${partner.id}-${key}.pdf`

          const result = await sendEmail({
            to: recipient,
            subject,
            html: `<p>Your sponsor report pack for ${key} is ready.</p><p>Generated files: ${csvFile}, ${pdfFile}</p>`,
          })

          const failed = Boolean(result?.error)
          recipientResults.push({
            recipient,
            result: failed ? 'failed' : 'sent',
            error: failed ? String(result?.error ?? 'Email send failed') : null,
            attempted_at: new Date().toISOString(),
          })

          if (failed) attemptFailed = true
        }

        if (!attemptFailed) {
          sent = true
          retryStatus = attempts > 1 ? 'succeeded' : 'none'
        } else {
          retryStatus = attempts < maxAttempts ? 'scheduled' : 'failed'
        }
      }

      if (sent) successfulCycles += 1

      const dispatchLog = {
        ticket: 'PB-Q1-006',
        month_key: key,
        partner_id: partner.id,
        partner_name: partner.name,
        recipient: recipients,
        timestamp: new Date().toISOString(),
        result: sent ? 'sent' : 'failed',
        retry_status: retryStatus,
        attempts,
        dry_run: !sendLive,
        schedule: config,
        export_run_id: exportRun?.id ?? null,
        recipient_results: recipientResults,
      }

      await sb
        .from('scheduled_job_observability_runs')
        .insert({
          user_id: userId,
          job_name: 'sponsor-export-dispatch',
          status: sent ? 'ok' : 'failed',
          details: dispatchLog,
        })

      if (!sent) {
        await sb.from('automation_alerts').insert({
          user_id: userId,
          source_table: 'scheduled_job_observability_runs',
          alert_code: 'sponsor_export_dispatch_failure',
          severity: 'high',
          message: `Sponsor export dispatch failed for ${partner.name} (${key}).`,
          status: 'open',
        })
      }

      deliveryLogs.push(dispatchLog)
    }

    const sendRate = activeCycles > 0 ? Number(((successfulCycles / activeCycles) * 100).toFixed(2)) : 100

    if (activeCycles > 0 && sendRate < 90) {
      await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'scheduled_job_observability_runs',
        alert_code: 'sponsor_export_send_rate_below_target',
        severity: 'high',
        message: `Sponsor send success rate ${sendRate}% is below target (90%) for ${key}.`,
        status: 'open',
      })
    }

    return NextResponse.json({
      ok: true,
      ticket: 'PB-Q1-006',
      month_key: key,
      schedule: {
        cadence: 'monthly',
        recommended_cron_utc: '0 9 1 * *',
        job_name: 'sponsor-export-dispatch',
      },
      send_mode: sendLive ? 'live' : 'dry_run',
      metrics: {
        active_partner_cycles: activeCycles,
        successful_partner_cycles: successfulCycles,
        sponsor_report_send_rate: sendRate,
        target_success_rate: 90,
        target_met: sendRate >= 90,
      },
      delivery_logs: deliveryLogs,
      retry: {
        endpoint: '/api/admin/automation/reporting/sponsor-export-dispatch',
        method: 'POST',
        body_template: {
          referenceDate: `${key}-01`,
          sendLive,
          forceSend: true,
        },
      },
    })
  } catch (error) {
    console.error('[reporting.sponsor-export-dispatch] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}