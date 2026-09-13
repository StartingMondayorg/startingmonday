import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { pathToFileURL } from 'node:url'
import { buildOutreachLogCursorFilter, checkForbidden, checkSignature, resolveLookbackDays } from './outreach-audit-rules.mjs'

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
  while (true) {
    let query = supabase
      .from('outreach_logs')
      .select('id, sent_at, message_body, subject, sender_email')
      .eq('sender_email', 'richard@startingmonday.app')
      .gte('sent_at', lookbackStartIso)
      .lte('sent_at', lookbackEndIso)
      .not('message_body', 'is', null)
      .order('sent_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(pageSize)

    const cursorFilter = buildOutreachLogCursorFilter(lastSentAt, lastId)
    if (cursorFilter) query = query.or(cursorFilter)

    const { data, error } = await query
    if (error) {
      console.error('Failed to query outreach_logs:', error.message)
      process.exit(1)
    }
    const rows = data ?? []
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e); process.exit(1) })
}
