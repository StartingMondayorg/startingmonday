#!/usr/bin/env node
// Schema drift checker: verifies every table and column declared in
// supabase/migrations/*.sql actually exists in the live Supabase instance
// the current env points at (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
//
// Probes through PostgREST, so it validates what the application actually sees,
// including schema-cache staleness. Read-only: every probe is a zero-row select.
//
// Usage:
//   doppler run -- node scripts/check-schema-drift.mjs            # staging (dev config)
//   doppler run -c prd -- node scripts/check-schema-drift.mjs     # production
//
// Exit codes: 0 = no drift, 1 = drift found, 2 = configuration/parse error.
//
// Background: unapplied migrations caused three silent prod outages (SMK-460,
// attribution outage, onboarding loop). PostgREST rejects the entire write when
// any column is missing (PGRST204), and unchecked writes made that invisible.

import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations')
const CONCURRENCY = 8

// Tables that migrations reference but that are legitimately absent from
// PostgREST probing (none currently; add names here with a reason).
const IGNORED_TABLES = new Set([])

function parseMigrations() {
  const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
  const tables = new Map()   // table -> first declaring file
  const columns = new Map()  // table -> Map(column -> first declaring file)

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').replace(/--.*$/gm, '')

    for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi)) {
      const table = m[1].toLowerCase()
      if (!tables.has(table)) tables.set(table, file)
    }

    for (const m of sql.matchAll(/alter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?([\s\S]*?);/gi)) {
      const table = m[1].toLowerCase()
      for (const c of m[2].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi)) {
        if (!columns.has(table)) columns.set(table, new Map())
        const cols = columns.get(table)
        const col = c[1].toLowerCase()
        if (!cols.has(col)) cols.set(col, file)
      }
    }
  }
  return { tables, columns }
}

async function probe(baseUrl, key, table, selectList) {
  const url = `${baseUrl}/rest/v1/${table}?select=${encodeURIComponent(selectList.join(','))}&limit=0`
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=none' },
  })
  if (res.ok) return { ok: true }
  let body = {}
  try { body = await res.json() } catch { /* non-JSON error */ }
  return { ok: false, status: res.status, code: body.code ?? null, message: body.message ?? '' }
}

async function main() {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!baseUrl || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run under doppler.')
    process.exit(2)
  }

  const { tables, columns } = parseMigrations()
  const findings = []

  // One work item per table: verify the table, then all its expected columns.
  const work = []
  const allTables = new Set([...tables.keys(), ...columns.keys()])
  for (const table of allTables) {
    if (IGNORED_TABLES.has(table)) continue
    work.push(async () => {
      const declaredIn = tables.get(table) ?? [...(columns.get(table)?.values() ?? [])][0]
      const tableProbe = await probe(baseUrl, key, table, ['*'])
      if (!tableProbe.ok) {
        // 42P01 = relation does not exist; PGRST205 = table not in schema cache
        findings.push({ kind: 'table', table, column: null, source: declaredIn, detail: tableProbe.code ?? `http ${tableProbe.status}` })
        return
      }
      const cols = columns.get(table)
      if (!cols || cols.size === 0) return
      const colNames = [...cols.keys()]
      const batchProbe = await probe(baseUrl, key, table, colNames)
      if (batchProbe.ok) return
      // Narrow down which columns are missing.
      for (const col of colNames) {
        const single = await probe(baseUrl, key, table, [col])
        if (!single.ok) {
          findings.push({ kind: 'column', table, column: col, source: cols.get(col), detail: single.code ?? `http ${single.status}` })
        }
      }
    })
  }

  let cursor = 0
  async function worker() {
    while (cursor < work.length) {
      const job = work[cursor++]
      await job()
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  findings.sort((a, b) => a.source.localeCompare(b.source) || a.table.localeCompare(b.table))

  const host = new URL(baseUrl).host
  if (findings.length === 0) {
    console.log(`Schema drift check: PASS (${allTables.size} tables checked against ${host})`)
    return
  }
  console.error(`Schema drift check: FAIL - ${findings.length} objects declared in migrations are missing from ${host}`)
  for (const f of findings) {
    console.error(`- ${f.kind}: ${f.table}${f.column ? '.' + f.column : ''} (from ${f.source}, ${f.detail})`)
  }
  process.exit(1)
}

main().catch((error) => {
  console.error('Schema drift check errored:', error instanceof Error ? error.message : String(error))
  process.exit(2)
})
