#!/usr/bin/env node
/**
 * Report repo migrations that are not applied to a target database.
 *
 * Migration 165 sat unapplied in production for seven weeks while the code that
 * depended on its columns shipped (SMK-456). Every signup's attribution and
 * consent write was rejected, silently, the whole time. This script exists so
 * that drift is visible instead of showing up as a campaign with zero signups.
 *
 * Usage:
 *   doppler run -- node scripts/check-migrations-applied.mjs
 *
 * Requires a direct Postgres connection string in one of:
 *   SUPABASE_DB_URL | DATABASE_URL | POSTGRES_URL
 *
 * Exits 1 when any migration is missing, so CI can gate on it.
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations')

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  console.error('No database URL found (set SUPABASE_DB_URL, DATABASE_URL, or POSTGRES_URL).')
  process.exit(2)
}

let postgres
try {
  ;({ default: postgres } = await import('postgres'))
} catch {
  console.error('The "postgres" package is required: npm i -D postgres')
  process.exit(2)
}

/**
 * Pull the columns a migration adds, as [table, column] pairs.
 * Deliberately narrow: `alter table ... add column ...` is the shape that
 * caused the outage, and a partial check that never false-alarms is worth
 * more here than a full SQL parser.
 */
function addedColumns(sql) {
  const pairs = []
  const statements = sql.split(';')
  for (const statement of statements) {
    const table = statement.match(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?["']?(\w+)["']?/i)
    if (!table) continue
    const columnPattern = /add\s+column\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?/gi
    let match
    while ((match = columnPattern.exec(statement)) !== null) {
      pairs.push([table[1].toLowerCase(), match[1].toLowerCase()])
    }
  }
  return pairs
}

const sql = postgres(connectionString, { prepare: false, max: 1, idle_timeout: 5 })

try {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()

  const existing = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
  `
  const present = new Set(existing.map((r) => `${r.table_name.toLowerCase()}.${r.column_name.toLowerCase()}`))

  const missing = []
  for (const file of files) {
    const contents = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    for (const [table, column] of addedColumns(contents)) {
      if (!present.has(`${table}.${column}`)) {
        missing.push({ file, table, column })
      }
    }
  }

  if (missing.length === 0) {
    console.log(`Migration check: OK -- every column added by ${files.length} migrations exists.`)
    process.exit(0)
  }

  console.error('Migration check: FAIL -- these migrations are not applied:\n')
  for (const { file, table, column } of missing) {
    console.error(`  ${file}: missing ${table}.${column}`)
  }
  console.error('\nApply them via the Supabase SQL editor, then re-run this check.')
  process.exit(1)
} catch (error) {
  console.error('Migration check could not run:', error.message)
  process.exit(2)
} finally {
  await sql.end({ timeout: 5 })
}
