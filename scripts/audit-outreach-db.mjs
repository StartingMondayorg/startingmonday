import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { checkForbidden, checkSignature, resolveLookbackDays } from './outreach-audit-rules.mjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const lookbackDays = resolveLookbackDays()
  const nowMs = Date.now()
  const lookbackEndIso = new Date(nowMs).toISOString()
  const lookbackStartIso = new Date(nowMs - lookbackDays * 24 * 60 * 60 * 1000).toISOString()
  let pageSize = 1000, scanned = 0, failures = 0
  let lastSentAt = null
  let lastId = null

  const buildBaseQuery = () => supabase
    .from('outreach_logs')
    .select('id, sent_at, message_body, subject, sender_email')
    .eq('sender_email', 'richard@startingmonday.app')
    .gte('sent_at', lookbackStartIso)
    .lte('sent_at', lookbackEndIso)
    .not('message_body', 'is', null)
    .order('sent_at', { ascending: true })
    .order('id', { ascending: true })

  while (true) {
    let rows = []
    if (lastSentAt == null || lastId == null) {
      const { data, error } = await buildBaseQuery().limit(pageSize)
      if (error) {
        console.error('Failed to query outreach_logs:', error.message)
        process.exit(1)
      }
      rows = data ?? []
    } else {
      const { data: sameTimestampRows, error: sameTimestampError } = await buildBaseQuery()
        .eq('sent_at', lastSentAt)
        .gt('id', lastId)
        .limit(pageSize)
      if (sameTimestampError) {
        console.error('Failed to query outreach_logs:', sameTimestampError.message)
        process.exit(1)
      }
      rows = sameTimestampRows ?? []
      if (rows.length < pageSize) {
        const { data: laterRows, error: laterRowsError } = await buildBaseQuery()
          .gt('sent_at', lastSentAt)
          .limit(pageSize - rows.length)
        if (laterRowsError) {
          console.error('Failed to query outreach_logs:', laterRowsError.message)
          process.exit(1)
        }
        rows = rows.concat(laterRows ?? [])
      }
    }
    if (rows.length === 0) break
    scanned += rows.length
    for (const row of rows) {
      const errors = []
      if (!checkSignature(row.message_body)) errors.push('Missing signature')
      if (checkForbidden(row.message_body) || checkForbidden(row.subject)) errors.push('Forbidden phrase')
      if (errors.length) {
        failures++
        console.log(`[${row.id}] ${errors.join(', ')}`)
      }
    }
    const lastRow = rows[rows.length - 1]
    lastSentAt = lastRow?.sent_at ?? null
    lastId = lastRow?.id ?? null
    if (rows.length < pageSize) break
  }
  if (failures) {
    console.error(`\nFAIL: ${failures} of ${scanned} outreach_log rows failed DB audit in the last ${lookbackDays} day(s).`)
    process.exit(1)
  } else {
    console.log(`PASS: All ${scanned} outreach_log rows passed DB audit in the last ${lookbackDays} day(s).`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
