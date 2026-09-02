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

  if (!dryRun) {
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
