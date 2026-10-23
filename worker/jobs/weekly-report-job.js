import Anthropic from '@anthropic-ai/sdk'
import { getSupabase } from '../lib/supabase.js'
import { sendEmail } from '../lib/send-email.js'
import { trackUsage } from '../lib/usage-tracker.js'
import { logger } from '../lib/logger.js'
import { HAIKU } from '../lib/models.js'
import { shouldSuppressNudge } from './momentum-job.js'
import { watermarkEmailHtml } from '../lib/watermark.js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'

const STAGE_LABELS = {
  watching: 'Watching',
  researching: 'Researching',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
}

let _anthropic = null
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}

async function getSuggestedActions({ companyList, activeCount, stageSummary, momentumScore, momentumDelta, newMatches, followUps }) {
  const scanSection = newMatches.length
    ? `Scan matches this week: ${newMatches.map(m => `${m.companyName} (${m.matchingRoles.map(r => r.title).join(', ')})`).join('; ')}`
    : 'No new role matches from career page scans this week.'

  const fuSection = followUps.length
    ? `Pending follow-ups: ${followUps.map(f => `${f.action} (due ${f.due_date})`).slice(0, 3).join('; ')}`
    : 'No pending follow-ups.'

  const deltaStr = momentumDelta !== null
    ? ` (${momentumDelta > 0 ? '+' : ''}${momentumDelta} from last week)`
    : ''

  const prompt = `You are advising a senior executive job seeker. Here is their search status this week:

Pipeline: ${companyList.length} companies tracked, ${activeCount} in active stages (applied/interviewing/offer)
Stage breakdown: ${stageSummary}
Momentum score: ${momentumScore ?? 'N/A'}/100${deltaStr}
${scanSection}
${fuSection}

Give exactly 3 specific, actionable suggestions for this week. Number each one (1. 2. 3.). One sentence each. Name specific actions — not general principles. Focus on what will move this search forward most. No preamble.`

  const response = await getAnthropic().messages.create({
    model: HAIKU,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const lines = text.split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 20)
    .slice(0, 3)

  return lines
}

// Opt-in only (P1b, simplification R-1): the summary goes to users who turned it
// on in Settings > Email preferences. Everyone else gets the daily briefing alone.
export async function selectWeeklySummaryRecipients(supabase) {
  const { data: optedIn, error: optInError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('weekly_summary_opt_in', true)

  if (optInError) {
    logger.error('weekly-report-job: opt-in query failed', { error: optInError.message })
    return []
  }

  const optedInIds = (optedIn ?? []).map(row => row.user_id).filter(Boolean)
  if (optedInIds.length === 0) return []

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .in('id', optedInIds)
    .in('subscription_status', ['trialing', 'active'])

  if (error) {
    logger.error('weekly-report-job: users query failed', { error: error.message })
    return []
  }
  return users ?? []
}

export async function runWeeklyReportJob() {
  const supabase = getSupabase()
  logger.info('weekly-report-job: starting')

  const users = await selectWeeklySummaryRecipients(supabase)

  if (!users.length) {
    logger.info('weekly-report-job: no opted-in users — done')
    return
  }

  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const lastSundayStr = (() => {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })()

  let sent = 0

  for (const user of users) {
    try {
      const [
        { data: profile },
        { data: companies },
        { data: followUps },
        { data: scanResults },
        { data: momentumHistory },
      ] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('full_name, onboarding_completed_at, momentum_score, search_persona')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('companies')
          .select('id, name, stage, fit_score')
          .eq('user_id', user.id)
          .is('archived_at', null)
          .order('fit_score', { ascending: false, nullsFirst: false }),
        supabase
          .from('follow_ups')
          .select('due_date, action, companies(name)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(5),
        supabase
          .from('scan_results')
          .select('company_id, ai_score, ai_summary, raw_hits, companies(name)')
          .eq('user_id', user.id)
          .eq('status', 'success')
          .gte('scanned_at', since7d)
          .gt('ai_score', 0)
          .order('ai_score', { ascending: false })
          .limit(5),
        supabase
          .from('momentum_scores')
          .select('week_of, score')
          .eq('user_id', user.id)
          .order('week_of', { ascending: false })
          .limit(2),
      ])

      if (!profile?.onboarding_completed_at) continue

      const firstName = profile.full_name?.split(' ')[0] ?? 'there'
      const companyList = companies ?? []
      const activeCount = companyList.filter(c =>
        ['interviewing', 'applied', 'offer'].includes(c.stage)
      ).length

      // ── Momentum delta ────────────────────────────────────────────────────────
      const currentScore = profile.momentum_score ?? null
      const prevEntry = (momentumHistory ?? []).find(h => h.week_of === lastSundayStr)
      const prevScore = prevEntry?.score ?? null
      const momentumDelta = currentScore !== null && prevScore !== null ? currentScore - prevScore : null

      const suppress = shouldSuppressNudge(profile.search_persona, currentScore, activeCount)

      // ── Stage breakdown ───────────────────────────────────────────────────────
      const stageCounts = {}
      for (const c of companyList) {
        stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1
      }
      const stageSummary = Object.entries(stageCounts)
        .map(([s, n]) => `${STAGE_LABELS[s] ?? s}: ${n}`)
        .join(', ')

      // ── Scan highlights ───────────────────────────────────────────────────────
      const newMatches = (scanResults ?? [])
        .map(scan => ({
          companyName: scan.companies?.name ?? 'Unknown Company',
          aiScore: scan.ai_score,
          aiSummary: scan.ai_summary,
          matchingRoles: (scan.raw_hits ?? [])
            .filter(h => h.is_match)
            .map(h => ({ title: h.title, score: h.score, isNew: h.is_new })),
        }))
        .filter(m => m.matchingRoles.length > 0)

      // ── Claude suggested actions ──────────────────────────────────────────────
      let suggestedActions = []
      if (!suppress && companyList.length > 0) {
        try {
          suggestedActions = await getSuggestedActions({
            companyList,
            activeCount,
            stageSummary,
            momentumScore: currentScore,
            momentumDelta,
            newMatches,
            followUps: followUps ?? [],
          })
          await trackUsage(supabase, { service: 'anthropic', requests: 1, tokens: 400 })
        } catch (err) {
          logger.warn(`weekly-report-job: Claude call failed for user ${user.id}`, { error: err.message })
        }
      }

      // ── Render ────────────────────────────────────────────────────────────────

      const stageRows = Object.entries(stageCounts)
        .map(([stage, count]) => `
          <tr>
            <td style="padding:6px 12px;font-size:13px;color:#0f172a">${STAGE_LABELS[stage] ?? stage}</td>
            <td style="padding:6px 12px;font-size:13px;font-weight:700;color:#0f172a;text-align:right">${count}</td>
          </tr>`)
        .join('')

      const fuItems = (followUps ?? [])
        .map(fu => {
          const company = fu.companies?.name ?? ''
          const date = new Date(fu.due_date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
          })
          return `<li style="font-size:13px;color:#0f172a;margin-bottom:6px">
            <span style="color:#64748b">${date}</span> — ${fu.action}${company ? ` <span style="color:#94a3b8">(${company})</span>` : ''}
          </li>`
        })
        .join('')

      const matchItems = newMatches
        .map(m => `
          <li style="font-size:13px;color:#0f172a;margin-bottom:8px">
            <span style="font-weight:600">${m.companyName}</span>
            <span style="color:#64748b"> — ${m.matchingRoles.map(r => `${r.title}${r.isNew ? ' <span style="color:#16a34a;font-size:11px">NEW</span>' : ''}`).join(', ')}</span>
            ${m.aiSummary ? `<br><span style="font-size:12px;color:#94a3b8">${m.aiSummary}</span>` : ''}
          </li>`)
        .join('')

      const momentumArrow = momentumDelta === null ? '' : momentumDelta > 0 ? '↑' : momentumDelta < 0 ? '↓' : '→'
      const momentumColor = momentumDelta === null ? '#0f172a' : momentumDelta > 0 ? '#16a34a' : momentumDelta < 0 ? '#dc2626' : '#64748b'
      const momentumDeltaStr = momentumDelta === null ? '' : ` <span style="color:${momentumColor};font-size:13px">${momentumArrow} ${momentumDelta > 0 ? '+' : ''}${momentumDelta} vs last week</span>`

      const actionItems = suggestedActions
        .map((a, i) => `<li style="font-size:13px;color:#0f172a;margin-bottom:8px"><span style="font-weight:600">${i + 1}.</span> ${a}</li>`)
        .join('')

      const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0f172a;padding:16px 24px">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#475569">Starting Monday</span>
        </div>
        <div style="padding:24px">
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 4px">Weekly snapshot, ${firstName}.</h2>
          <p style="font-size:13px;color:#64748b;margin:0 0 24px">Here&rsquo;s where your search stands.</p>

          <div style="display:flex;gap:16px;margin-bottom:24px">
            <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#0f172a">${companyList.length}</div>
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-top:4px">Companies</div>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#0f172a">${activeCount}</div>
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-top:4px">Active</div>
            </div>
            ${currentScore !== null ? `
            <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#0f172a">${currentScore}</div>
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-top:4px">Momentum${momentumDeltaStr}</div>
            </div>` : ''}
          </div>

          ${stageRows ? `
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin:0 0 8px">Pipeline breakdown</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tbody>${stageRows}</tbody>
          </table>` : ''}

          ${matchItems ? `
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin:0 0 8px">Scan highlights this week</p>
          <ul style="margin:0 0 24px;padding-left:16px">${matchItems}</ul>` : ''}

          ${fuItems ? `
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin:0 0 8px">Upcoming actions</p>
          <ul style="margin:0 0 24px;padding-left:16px">${fuItems}</ul>` : ''}

          ${actionItems ? `
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin:0 0 8px">Suggested focus this week</p>
          <ul style="margin:0 0 24px;padding-left:16px">${actionItems}</ul>` : ''}

          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0f172a;color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:4px;text-decoration:none">Open dashboard</a>
        </div>
      </div>`

      await sendEmail({
        to: user.email,
        subject: `Your weekly search snapshot — Starting Monday`,
        html: watermarkEmailHtml(html, user.id),
      })
      await trackUsage(supabase, { service: 'resend', requests: 1 })
      sent++
      logger.info(`weekly-report-job: sent to user ${user.id}`, { momentumScore: currentScore, momentumDelta, matches: newMatches.length, actions: suggestedActions.length })
    } catch (err) {
      logger.error(`weekly-report-job: error for user ${user.id}`, { error: err.message })
    }
  }

  logger.info('weekly-report-job: complete', { sent, total: users.length })
}
