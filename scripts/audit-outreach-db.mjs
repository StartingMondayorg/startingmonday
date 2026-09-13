import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import {
  checkForbidden,
  checkSignature,
  computeLookbackWindow,
  resolveLookbackDays,
} from './outreach-audit-rules.mjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const lookbackDays = resolveLookbackDays()
  const maxAuditRows = 50000
  const nowMs = Date.now()
  const { startIso: lookbackStartIso, endIso: lookbackEndIso } = computeLookbackWindow(nowMs, lookbackDays)
  let scanned = 0, failures = 0

  const { data, error } = await supabase
    .from('outreach_logs')
    .select('id, sent_at, message_body, subject, sender_email')
    .eq('sender_email', 'richard@startingmonday.app')
    .gte('sent_at', lookbackStartIso)
    .lte('sent_at', lookbackEndIso)
    .not('message_body', 'is', null)
    .order('sent_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(maxAuditRows)
  if (error) {
    console.error('Failed to query outreach_logs:', error.message)
    process.exit(1)
  }
  const rows = data ?? []
  if (rows.length >= maxAuditRows) {
    console.error(`Query reached row limit (${maxAuditRows}); narrow the audit window or increase maxAuditRows.`)
    process.exit(1)
  }
  scanned = rows.length
  for (const row of rows) {
    const errors = []
    if (!checkSignature(row.message_body)) errors.push('Missing signature')
    if (checkForbidden(row.message_body) || checkForbidden(row.subject)) errors.push('Forbidden phrase')
    if (errors.length) {
      failures++
      console.log(`[${row.id}] ${errors.join(', ')}`)
    }
  }
  if (failures) {
    console.error(`\nFAIL: ${failures} of ${scanned} outreach_log rows failed DB audit in the last ${lookbackDays} day(s).`)
    process.exit(1)
  } else {
    console.log(`PASS: All ${scanned} outreach_log rows passed DB audit in the last ${lookbackDays} day(s).`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
