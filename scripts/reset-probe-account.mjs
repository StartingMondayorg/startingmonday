#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { postSlackText, writeLatestReportFiles } from './lib/agent-report-kit.mjs'

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket
}

const slackWebhook = process.env.SLACK_RELIABILITY_SERVICE_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || ''
const slackChannel = process.env.RELIABILITY_SLACK_CHANNEL || 'reliability---service'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
const targetEmail = [
  process.env.PROBE_ACCOUNT_EMAIL,
  process.env.PLAYWRIGHT_SYNTH_SIGNUP_EMAIL,
  process.env.PLAYWRIGHT_TEST_EMAIL,
]
  .map((value) => (value ?? '').trim().toLowerCase())
  .find((value) => value.length > 0) ?? ''
const dryRun = (process.env.PROBE_RESET_DRY_RUN ?? 'false').trim().toLowerCase() === 'true'

// The company Playwright global-setup seeds so authenticated monitoring agents
// always find at least one active company (see tests/e2e/global-setup.ts).
// The capacity reset must not archive it: doing so left the probe account with
// zero companies and made the dashboard behavior baseline signals checks flap.
const anchorCompanyName = (process.env.PROBE_ANCHOR_COMPANY_NAME ?? 'Synthetic Monitoring Anchor').trim()

// Synthetic signals kept on the anchor company so the trust integrity agent's
// signal-parity contract has extractable counts on /dashboard,
// /dashboard/briefing and /dashboard/signals. All three routes count
// company_signals rows in a 7-day window, so the reset re-dates these rows to
// keep them inside the window; the summary prefix marks them as monitoring
// data. Confidence 90 clears the Sprint 5 suppression floor (>= 45).
const SYNTHETIC_SIGNAL_MARKER = 'Synthetic monitoring signal:'
const SYNTHETIC_PARITY_SIGNALS = [
  {
    signal_type: 'expansion',
    signal_summary: `${SYNTHETIC_SIGNAL_MARKER} expansion anchor for dashboard parity checks`,
    source_kind: 'manual_news',
    confidence: 90,
  },
  {
    signal_type: 'new_product',
    signal_summary: `${SYNTHETIC_SIGNAL_MARKER} product anchor for dashboard parity checks`,
    source_kind: 'manual_news',
    confidence: 90,
  },
]

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
}

async function findUserByEmail(admin, email) {
  let page = 1
  const perPage = 200
  while (page <= 10) {
    const listed = await admin.auth.admin.listUsers({ page, perPage })
    if (listed.error) throw listed.error
    const users = listed.data?.users ?? []
    const matched = users.find((user) => (user.email ?? '').trim().toLowerCase() === email)
    if (matched) return matched
    if (users.length < perPage) break
    page += 1
  }
  return null
}

function buildMarkdown(report) {
  const lines = []
  lines.push('# Probe Account Reset Report')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Channel: ${report.channel}`)
  lines.push(`Email: ${report.email}`)
  lines.push(`Dry run: ${report.dryRun}`)
  lines.push(`Status: ${report.status}`)
  lines.push(`Active companies before: ${report.activeCompaniesBefore}`)
  lines.push(`Companies archived: ${report.archivedCompanies}`)
  lines.push(`First company milestone reset: ${report.firstCompanyMilestoneReset}`)
  lines.push(`Onboarding marked complete: ${report.onboardingMarkedComplete}`)
  lines.push(`Synthetic parity signals refreshed: ${report.syntheticSignalsRefreshed}`)
  lines.push(`Synthetic parity signals cleaned: ${report.syntheticSignalsCleaned}`)
  lines.push('')
  return `${lines.join('\n')}\n`
}

function buildSlackText(report) {
  return [
    report.status === 'ok'
      ? '*Probe account reset completed*'
      : '*Probe account reset failed*',
    `Channel: ${report.channel}`,
    `Email: ${report.email}`,
    `Dry run: ${report.dryRun}`,
    `Active companies before: ${report.activeCompaniesBefore}`,
    `Companies archived: ${report.archivedCompanies}`,
    `First-company milestone reset: ${report.firstCompanyMilestoneReset}`,
    `Onboarding marked complete: ${report.onboardingMarkedComplete}`,
    `Synthetic parity signals refreshed: ${report.syntheticSignalsRefreshed}`,
  ].join('\n')
}

async function main() {
  requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl)
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey)
  requireEnv('PROBE_ACCOUNT_EMAIL or PLAYWRIGHT_SYNTH_SIGNUP_EMAIL or PLAYWRIGHT_TEST_EMAIL', targetEmail)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const user = await findUserByEmail(admin, targetEmail)
  if (!user?.id) throw new Error(`Probe account not found for email: ${targetEmail}`)

  const countResult = await admin
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('archived_at', null)

  if (countResult.error) throw countResult.error
  const activeCompaniesBefore = countResult.count ?? 0

  let archivedCompanies = 0
  let firstCompanyMilestoneReset = false
  let onboardingMarkedComplete = false
  let syntheticSignalsRefreshed = 0
  let syntheticSignalsCleaned = 0

  if (!dryRun) {
    // Authenticated monitoring agents are redirected to /onboarding whenever
    // user_profiles.onboarding_completed_at is null, which strands every
    // dashboard contract check. The reset keeps the probe account in a
    // monitoring-ready state, so it repairs that flag when it is missing.
    const profileRepair = await admin
      .from('user_profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('onboarding_completed_at', null)
      .select('user_id')

    if (profileRepair.error) throw profileRepair.error
    onboardingMarkedComplete = Array.isArray(profileRepair.data) && profileRepair.data.length > 0

    // Refresh the synthetic parity signals on the anchor company (see the
    // SYNTHETIC_PARITY_SIGNALS note above). Uses the (company_id, signal_type,
    // signal_date) unique key for the upsert and clears older marker rows so
    // they do not accumulate as the date advances.
    const anchorCompany = await admin
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', anchorCompanyName)
      .is('archived_at', null)
      .maybeSingle()

    if (anchorCompany.error) throw anchorCompany.error

    if (anchorCompany.data?.id) {
      const today = new Date().toISOString().split('T')[0]
      for (const template of SYNTHETIC_PARITY_SIGNALS) {
        const upserted = await admin
          .from('company_signals')
          .upsert(
            {
              company_id: anchorCompany.data.id,
              user_id: user.id,
              signal_type: template.signal_type,
              signal_summary: template.signal_summary,
              signal_date: today,
              source_kind: template.source_kind,
              confidence: template.confidence,
            },
            { onConflict: 'company_id,signal_type,signal_date' },
          )
          .select('id')

        if (upserted.error) throw upserted.error
        syntheticSignalsRefreshed += Array.isArray(upserted.data) ? upserted.data.length : 0
      }

      const outdated = await admin
        .from('company_signals')
        .delete()
        .eq('user_id', user.id)
        .like('signal_summary', `${SYNTHETIC_SIGNAL_MARKER}%`)
        .lt('signal_date', today)
        .select('id')

      if (outdated.error) throw outdated.error
      syntheticSignalsCleaned = Array.isArray(outdated.data) ? outdated.data.length : 0
    }

    const archiveResult = await admin
      .from('companies')
      .update({ archived_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('archived_at', null)
      .neq('name', anchorCompanyName)
      .select('id')

    if (archiveResult.error) throw archiveResult.error
    archivedCompanies = Array.isArray(archiveResult.data) ? archiveResult.data.length : 0

    const userReset = await admin
      .from('users')
      .update({ first_company_added_at: null })
      .eq('id', user.id)
      .select('id')

    if (userReset.error) throw userReset.error
    firstCompanyMilestoneReset = Array.isArray(userReset.data) && userReset.data.length > 0
  }

  const report = {
    generatedAt: new Date().toISOString(),
    channel: slackChannel,
    status: 'ok',
    email: targetEmail,
    userId: user.id,
    dryRun,
    activeCompaniesBefore,
    archivedCompanies,
    firstCompanyMilestoneReset,
    onboardingMarkedComplete,
    syntheticSignalsRefreshed,
    syntheticSignalsCleaned,
  }

  writeLatestReportFiles({
    jsonPath: 'docs/status/probe-account-reset.latest.json',
    markdownPath: 'docs/status/probe-account-reset.latest.md',
    report,
    markdown: buildMarkdown(report),
  })

  const posted = await postSlackText({ webhookUrl: slackWebhook, text: buildSlackText(report) })
  if (!posted) console.log('No Slack webhook configured; skipping Slack post.')

  console.log(`Probe account reset completed for ${targetEmail}.`) 
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error)
  console.error(message)
  process.exit(1)
})
