/**
 * WS1-05 SEC coverage audit (read-only).
 * Reports, overall and by sector: denominator (active pipeline companies),
 * numerator (sec_cik resolved), confirmed non-SEC (is_public_company=false),
 * and unresolved identities (both null). Records query date.
 *
 * Usage: node --env-file=.env.local tmp/ws1-05-sec-coverage-audit.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing Supabase env'); process.exit(1) }

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const PAGE = 1000
let rows = []
for (let from = 0; ; from += PAGE) {
  const { data, error } = await db
    .from('companies')
    .select('sector, sec_cik, is_public_company, archived_at')
    .range(from, from + PAGE - 1)
  if (error) { console.error(error.message); process.exit(1) }
  rows = rows.concat(data)
  if (data.length < PAGE) break
}

const active = rows.filter(r => !r.archived_at)
const bySector = new Map()
for (const r of active) {
  const s = r.sector?.trim() || '(unspecified)'
  if (!bySector.has(s)) bySector.set(s, { total: 0, cik: 0, nonSec: 0, unresolved: 0 })
  const b = bySector.get(s)
  b.total++
  if (r.sec_cik) b.cik++
  else if (r.is_public_company === false) b.nonSec++
  else b.unresolved++
}

const overall = { total: active.length, cik: 0, nonSec: 0, unresolved: 0 }
for (const b of bySector.values()) { overall.cik += b.cik; overall.nonSec += b.nonSec; overall.unresolved += b.unresolved }

const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : 'n/a'
console.log(`WS1-05 SEC coverage audit — query date ${new Date().toISOString()}`)
console.log(`Total rows fetched: ${rows.length} (archived excluded: ${rows.length - active.length})`)
console.log(`OVERALL  total=${overall.total} sec_cik=${overall.cik} (${pct(overall.cik, overall.total)}) non-sec=${overall.nonSec} unresolved=${overall.unresolved}`)
console.log('--- by sector (desc by total) ---')
for (const [s, b] of [...bySector.entries()].sort((a, z) => z[1].total - a[1].total)) {
  console.log(`${s.padEnd(32)} total=${String(b.total).padStart(4)} sec=${String(b.cik).padStart(4)} (${pct(b.cik, b.total).padStart(6)}) non-sec=${String(b.nonSec).padStart(4)} unresolved=${String(b.unresolved).padStart(4)}`)
}
