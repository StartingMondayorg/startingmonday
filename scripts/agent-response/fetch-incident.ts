#!/usr/bin/env npx tsx
// Reads one incident from Supabase so the agent job never receives alert data
// through a workflow input, where it could be interpolated into a shell command.
//
//   npx tsx scripts/agent-response/fetch-incident.ts --fingerprint <fp> --out incident.json
//
// Everything async lives inside main(). tsx transforms a plain .ts file in a
// CommonJS package as CJS, which rejects top-level await outright.

import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

async function main(): Promise<void> {
  const fingerprint = flag('fingerprint')
  const out = flag('out') ?? 'incident.json'

  if (!fingerprint) {
    throw new Error('Usage: fetch-incident.ts --fingerprint <fp> [--out incident.json]')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('agent_incidents')
    .select('*')
    .eq('fingerprint', fingerprint)
    .maybeSingle()

  if (error) throw new Error(`incident lookup failed: ${error.code} ${error.message}`)
  if (!data) throw new Error(`no incident with fingerprint ${fingerprint}`)

  writeFileSync(out, JSON.stringify(data, null, 2))
  console.log(`incident ${fingerprint} (${data.alert_class}, seen ${data.occurrence_count}x) -> ${out}`)
}

main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
