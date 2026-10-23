import { getSupabase } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'
import { trackUsage } from '../lib/usage-tracker.js'
import { assembleContext } from '../briefing/assemble-context.js'
import { generateBriefing } from '../briefing/generate-briefing.js'
import { renderBriefingEmail } from '../briefing/email-template.js'
import { sendBriefing } from '../briefing/send-briefing.js'
import {
  briefingIdempotencyKey,
  claimBriefingSend,
  markBriefingSendFailed,
  markBriefingSendSent,
  recipientHash,
} from '../briefing/send-claims.js'
import { watermarkEmailHtml, injectTrackingPixel } from '../lib/watermark.js'

const BRIEFING_LOCK_KEY = 7329841024n

// Logged once per process so a missing migration 190 is visible without
// repeating the warning every 5 minutes for every user.
let claimsTableMissingLogged = false

const ABBR_TO_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }

function todayStrInTz(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

function dayNameInTz(tz) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(new Date())
}

function currentHHMMInTz(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const h = parts.find(p => p.type === 'hour')?.value ?? '00'
  const m = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function isWithinWindow(currentHHMM, targetHHMM, catchUpMinutes = 90) {
  const [ch, cm] = currentHHMM.split(':').map(Number)
  const [th, tm] = targetHHMM.split(':').map(Number)
  const current = ch * 60 + cm
  const target = th * 60 + tm
  return current >= target && current < target + catchUpMinutes
}

export async function runBriefingJob() {
  const supabase = getSupabase()
  logger.info('briefing-job: starting')

  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: BRIEFING_LOCK_KEY })
  if (!locked) {
    logger.warn('briefing-job: another instance running — skipping')
    return
  }

  try {
    // Fetch all active/trialing users with cursor-based pagination to avoid the 1000-row limit
    const PAGE_SIZE = 500
    let allUsers = []
    let lastId = null
    while (true) {
      let query = supabase.from('users').select('id, email')
        .in('subscription_status', ['trialing', 'active'])
        .order('id')
        .limit(PAGE_SIZE)
      if (lastId) query = query.gt('id', lastId)
      const { data: page, error: pageError } = await query
      if (pageError) {
        logger.error('briefing-job: failed to fetch users', { error: pageError.message })
        return
      }
      if (!page?.length) break
      allUsers = allUsers.concat(page)
      if (page.length < PAGE_SIZE) break
      lastId = page[page.length - 1].id
    }
    const users = allUsers

    const since36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

    const { data: profiles } = await supabase.from('user_profiles').select(
      'user_id, full_name, briefing_time, briefing_timezone, briefing_days, last_briefing_sent_at, briefing_frequency, search_status, placed_at'
    ).not('briefing_time', 'is', null)

    const { data: recentBriefingEvents, error: recentEventsError } = await supabase
      .from('user_events')
      .select('user_id, created_at, properties')
      .eq('event_name', 'briefing_email_sent')
      .gte('created_at', since36h)

    if (recentEventsError) {
      logger.error('briefing-job: failed to fetch recent briefing send events', { error: recentEventsError.message })
      return
    }

    if (!users?.length) {
      logger.info('briefing-job: no users — done')
      return
    }

    const profileByUserId = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))
    const recentBriefingByUserId = new Map()
    const recentBriefingByRecipient = new Map()
    for (const row of (recentBriefingEvents ?? [])) {
      const existing = recentBriefingByUserId.get(row.user_id)
      const createdAt = row.created_at
      if (!existing || new Date(createdAt).getTime() > new Date(existing).getTime()) {
        recentBriefingByUserId.set(row.user_id, createdAt)
      }

      // Events written before P2-5 carry the raw address in `to`; newer ones carry only its hash.
      const recipientKey = row.properties?.recipient_hash ?? recipientHash(row.properties?.to)
      if (recipientKey) {
        const recipientExisting = recentBriefingByRecipient.get(recipientKey)
        if (!recipientExisting || new Date(createdAt).getTime() > new Date(recipientExisting).getTime()) {
          recentBriefingByRecipient.set(recipientKey, createdAt)
        }
      }
    }

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const user of users) {
      const profile = profileByUserId[user.id]
      if (!profile) {
        logger.info(`briefing-job: skip ${user.id} — no profile or briefing_time not set`)
        skipped++; continue
      }

      const tz = profile.briefing_timezone ?? 'UTC'
      const briefingTime = profile.briefing_time.slice(0, 5)
      const briefingDays = (profile.briefing_days ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
        .map(d => ABBR_TO_FULL[d] ?? d)

      const dayName = dayNameInTz(tz)
      if (!briefingDays.includes(dayName)) {
        logger.info(`briefing-job: skip ${user.id} — today is ${dayName}, not in briefing_days ${JSON.stringify(briefingDays)}`)
        skipped++; continue
      }

      // Placed users get a weekly Monday digest only
      if ((profile.briefing_frequency ?? 'daily') === 'weekly' && dayName !== 'Monday') {
        logger.info(`briefing-job: skip ${user.id} — weekly frequency, today is ${dayName} (sends on Monday only)`)
        skipped++; continue
      }

      const currentHHMM = currentHHMMInTz(tz)
      if (!isWithinWindow(currentHHMM, briefingTime)) {
        logger.info(`briefing-job: skip ${user.id} — current ${currentHHMM} not within window of ${briefingTime} (tz: ${tz})`)
        skipped++; continue
      }

      const todayStr = todayStrInTz(tz)
      if (profile.last_briefing_sent_at) {
        const lastSentDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz })
          .format(new Date(profile.last_briefing_sent_at))
        if (lastSentDate === todayStr) {
          logger.info(`briefing-job: skip ${user.id} — already sent today (${todayStr})`)
          skipped++; continue
        }
      }

      const recentBriefingEventAt = recentBriefingByUserId.get(user.id)
      if (recentBriefingEventAt) {
        const lastEventDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz })
          .format(new Date(recentBriefingEventAt))
        if (lastEventDate === todayStr) {
          logger.info(`briefing-job: skip ${user.id} — briefing send event already recorded today (${todayStr})`)
          skipped++; continue
        }
      }

      const userRecipientHash = recipientHash(user.email)
      const recentRecipientBriefingAt = userRecipientHash ? recentBriefingByRecipient.get(userRecipientHash) : null
      if (recentRecipientBriefingAt) {
        const lastRecipientEventDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz })
          .format(new Date(recentRecipientBriefingAt))
        if (lastRecipientEventDate === todayStr) {
          logger.info(`briefing-job: skip ${user.id} — recipient inbox already received briefing today (${todayStr})`)
          skipped++; continue
        }
      }

      // claimKey is non-null only while this run owns a claim row; delivered
      // flips once Resend has accepted the email. Together they decide whether
      // a failure below may release the claim for a retry.
      let claimKey = null
      let delivered = false
      try {
        const searchStatus = profile.search_status ?? (profile.placed_at ? 'complete' : 'active')
        const context = await assembleContext(supabase, user.id, user.email, tz, searchStatus)
        if (!context) {
          logger.info(`briefing-job: skip ${user.id} — no companies in pipeline`)
          skipped++; continue
        }

        const localDate = context.todayStr ?? todayStr
        const claim = await claimBriefingSend(supabase, { userId: user.id, localDate })
        if (claim.outcome === 'skip') {
          logger.info(`briefing-job: skip ${user.id} — send claim for ${localDate}: ${claim.reason}`)
          skipped++; continue
        }
        if (claim.outcome === 'unavailable') {
          if (!claimsTableMissingLogged) {
            claimsTableMissingLogged = true
            logger.warn('briefing-job: briefing_send_claims table missing (migration 190 not applied) — sending without claims', {
              event: 'briefing_claims_unavailable',
            })
          }
        } else {
          claimKey = { userId: user.id, localDate }
          if (claim.reclaimed) {
            logger.warn(`briefing-job: reclaimed ${claim.previousStatus} send claim for ${user.id} (${localDate})`)
          }
        }

        // Look up coach brand for white-label header (if this user has an accepted coach seat)
        const { data: coachSeat } = await supabase
          .from('team_seats')
          .select('owner_id')
          .eq('member_user_id', user.id)
          .eq('status', 'accepted')
          .limit(1)
          .single()

        if (coachSeat?.owner_id) {
          const { data: partnerRow } = await supabase
            .from('partners')
            .select('company')
            .eq('user_id', coachSeat.owner_id)
            .single()
          if (partnerRow?.company) context.coachBrand = partnerRow.company
        }

        const briefing = await generateBriefing(context)
        const rawHtml = watermarkEmailHtml(renderBriefingEmail(context, briefing), user.id)
        const html = injectTrackingPixel(rawHtml, user.id, 'briefing', context.todayStr)

        let providerMessageId = null
        try {
          const result = await sendBriefing({
            to: user.email,
            subject: briefing.subject ?? `Your briefing — ${context.todayStr}`,
            html,
            idempotencyKey: briefingIdempotencyKey(user.id, localDate),
            userId: user.id,
          })
          providerMessageId = result?.id ?? null
        } catch (sendErr) {
          // A reclaimed claim regenerates the briefing, so its payload differs
          // from the earlier attempt. Resend answers that with this 409 only when
          // the key was already used within 24h: the earlier attempt reached
          // Resend, so the user already has today's briefing.
          if (sendErr?.code !== 'invalid_idempotent_request') throw sendErr
          logger.warn(`briefing-job: ${user.id} briefing for ${localDate} already accepted by Resend — recording as sent`)
        }
        delivered = true

        if (claimKey) {
          await markBriefingSendSent(supabase, { ...claimKey, providerMessageId })
        }

        const now = new Date().toISOString()

        // Mark signals notified first — if we crash after this but before updating the
        // timestamp, the send claim (status 'sent') still blocks a duplicate email
        // rather than leaving signal notifications pending permanently.
        const unnotifiedSignalIds = [
          ...(context.signals ?? []).filter(s => !s.notifiedAt).map(s => s.id),
          ...(context.patternAlerts ?? []).filter(s => !s.notifiedAt).map(s => s.id),
        ]
        if (unnotifiedSignalIds.length) {
          const { error: signalUpdateError } = await supabase
            .from('company_signals')
            .update({ notified_at: now })
            .in('id', unnotifiedSignalIds)
          if (signalUpdateError) {
            throw new Error(`Failed to mark notified signals: ${signalUpdateError.message}`)
          }
        }

        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .update({ last_briefing_sent_at: now })
          .eq('user_id', user.id)
        if (profileUpdateError) {
          throw new Error(`Failed to update last_briefing_sent_at: ${profileUpdateError.message}`)
        }

        const { error: eventInsertError } = await supabase
          .from('user_events')
          .insert({
            user_id: user.id,
            event_name: 'briefing_email_sent',
            properties: { source: 'briefing-job', sent_at: now, recipient_hash: userRecipientHash, local_date: localDate },
          })
        if (eventInsertError) {
          throw new Error(`Failed to insert briefing_email_sent event: ${eventInsertError.message}`)
        }

        await Promise.all([
          trackUsage(supabase, { service: 'resend', requests: 1 }),
          trackUsage(supabase, { service: 'anthropic', requests: 1, tokens: 1500 }),
        ])

        sent++
        logger.info(`briefing-job: sent to ${user.id}`, { userId: user.id, messageId: providerMessageId })
      } catch (err) {
        failed++
        logger.error(`briefing-job: error for ${user.id}`, { userId: user.id, delivered, error: err.message, stack: err.stack })
        // Release the claim for a retry only when nothing reached Resend; after
        // delivery the claim must keep blocking a second send.
        if (claimKey && !delivered) {
          await markBriefingSendFailed(supabase, claimKey).catch(markErr => {
            logger.error(`briefing-job: could not release send claim for ${user.id}`, { error: markErr.message })
          })
        }
      }
    }

    logger.info('briefing-job: complete', { sent, skipped, failed })
    if (failed > 0) {
      // Thrown after the loop so one user's failure never blocks the others,
      // and so runJob closes the Sentry check-in as an error and alerts.
      throw new Error(`briefing-job: ${failed} of ${users.length} users failed (sent ${sent}, skipped ${skipped})`)
    }
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: BRIEFING_LOCK_KEY })
  }
}
