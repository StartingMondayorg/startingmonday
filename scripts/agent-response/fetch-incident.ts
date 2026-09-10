#!/usr/bin/env npx tsx
// Reads one incident from Supabase so the agent job never receives alert data
// through a workflow input, where it could be interpolated into a shell command.
//
//   npx tsx scripts/agent-response/fetch-incident.ts --fingerprint <fp> --out incident.json

import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

const fingerprint = flag('fingerprint')
const out = flag('out') ?? 'incident.json'

if (!fingerprint) {
  console.error('Usage: fetch-incident.ts --fingerprint <fp> [--out incident.json]')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase
  .from('agent_incidents')
  .select('*')
  .eq('fingerprint', fingerprint)
  .maybeSingle()

if (error) {
  console.error(`incident lookup failed: ${error.code} ${error.message}`)
  process.exit(1)
}
if (!data) {
  console.error(`no incident with fingerprint ${fingerprint}`)
  process.exit(1)
}

writeFileSync(out, JSON.stringify(data, null, 2))
console.log(`incident ${fingerprint} (${data.alert_class}, seen ${data.occurrence_count}x) -> ${out}`)
