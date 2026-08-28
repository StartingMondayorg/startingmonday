#!/usr/bin/env node
/**
 * Staging seed orchestrator (SMK-465).
 *
 * Seeds the staging Supabase project in three layers, split on who owns the row:
 *
 *   reference  Copies non-user reference data from a source project (normally
 *              production). These tables carry no user_id, so no customer
 *              identity moves between environments.
 *   fixtures   Delegates to scripts/seed-demo.ts to build the deterministic
 *              synthetic personas.
 *   probe      Delegates to scripts/reset-probe-account.mjs so the E2E account
 *              starts each run from a known state.
 *
 * Dry run by default. Nothing is written without --apply.
 *
 * Usage:
 *   node scripts/seed-staging.mjs                        # dry run, all layers
 *   node scripts/seed-staging.mjs --apply
 *   node scripts/seed-staging.mjs --layer=reference --apply
 *   node scripts/seed-staging.mjs --layer=reference --include-exec-profiles --apply
 *
 * Required env:
 *   SEED_SOURCE_SUPABASE_URL        source project (read only)
 *   SEED_SOURCE_SERVICE_ROLE_KEY
 *   SEED_TARGET_SUPABASE_URL        staging project (written to)
 *   SEED_TARGET_SERVICE_ROLE_KEY
 *
 * The fixtures and probe layers additionally need the env their own scripts
 * document. This script points them at the target project automatically.
 */

import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

/**
 * Hard safety rail. The whole point of SMK-465 is that every environment had
 * quietly ended up pointing at this project. This script writes, so it refuses
 * to target production outright. There is deliberately no override flag.
 */
const PROD_PROJECT_REF = 'mytnhoxcgvnzxhgcumkf'

/**
 * Explicit allowlist, ordered so parents land before children.
 *
 * Deliberately not derived by scanning for tables without a user_id column: a
 * dynamic list silently grows into whatever the next migration adds, which is
 * exactly how customer data would end up copied by accident.
 */
const REFERENCE_TABLES = [
  'sectors',
  'industries',
  'canonical_companies',
  'reference_companies',
  'ats_boards',
  'role_openings',
  'warn_notices',
  'intelligence_companies',
]

/**
 * Real named people. Publicly sourced, but still personal data, so it is opt in
 * rather than part of the default copy.
 */
const EXEC_PROFILE_TABLE = 'executive_profiles'

const PAGE_SIZE = 500
const LAYERS = ['reference', 'fixtures', 'probe']

function parseArgs(argv) {
  const args = argv.slice(2)
  const layerArg = args.find((a) => a.startsWith('--layer='))
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const layer = layerArg ? layerArg.split('=')[1] : 'all'

  if (layer !== 'all' && !LAYERS.includes(layer)) {
    throw new Error(`Unknown --layer=${layer}. Expected one of: all, ${LAYERS.join(', ')}`)
  }

  return {
    apply: args.includes('--apply'),
    layer,
    includeExecProfiles: args.includes('--include-exec-profiles'),
    limit: limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : null,
  }
}

function projectRef(url) {
  const match = /https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(url.trim())
  return match ? match[1] : null
}

function requireEnv(name) {
  const value = (process.env[name] ?? '').trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function resolveEndpoints() {
  const sourceUrl = requireEnv('SEED_SOURCE_SUPABASE_URL')
  const sourceKey = requireEnv('SEED_SOURCE_SERVICE_ROLE_KEY')
  const targetUrl = requireEnv('SEED_TARGET_SUPABASE_URL')
  const targetKey = requireEnv('SEED_TARGET_SERVICE_ROLE_KEY')

  const sourceRef = projectRef(sourceUrl)
  const targetRef = projectRef(targetUrl)

  if (!sourceRef) throw new Error(`Could not parse a project ref from SEED_SOURCE_SUPABASE_URL`)
  if (!targetRef) throw new Error(`Could not parse a project ref from SEED_TARGET_SUPABASE_URL`)

  if (targetRef === PROD_PROJECT_REF) {
    throw new Error(
      `Refusing to run: the target project is production (${PROD_PROJECT_REF}). ` +
        `This script only writes to non-production projects.`,
    )
  }

  if (sourceRef === targetRef) {
    throw new Error(`Refusing to run: source and target are the same project (${sourceRef}).`)
  }

  return { sourceUrl, sourceKey, targetUrl, targetKey, sourceRef, targetRef }
}

function admin(url, key) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function copyTable(source, target, table, { apply, limit }) {
  let copied = 0
  let read = 0
  let from = 0

  for (;;) {
    const pageEnd = from + PAGE_SIZE - 1
    const { data, error } = await source.from(table).select('*').order('id').range(from, pageEnd)

    if (error) {
      return { table, ok: false, message: error.message, read, copied }
    }
    if (!data || data.length === 0) break

    read += data.length
    const rows = limit ? data.slice(0, Math.max(0, limit - copied)) : data

    if (rows.length > 0 && apply) {
      const { error: writeError } = await target.from(table).upsert(rows, { onConflict: 'id' })
      if (writeError) {
        return { table, ok: false, message: writeError.message, read, copied }
      }
    }

    copied += rows.length

    if (limit && copied >= limit) break
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { table, ok: true, read, copied }
}

async function runReferenceLayer(endpoints, options) {
  const source = admin(endpoints.sourceUrl, endpoints.sourceKey)
  const target = admin(endpoints.targetUrl, endpoints.targetKey)

  const tables = [...REFERENCE_TABLES]
  if (options.includeExecProfiles) tables.push(EXEC_PROFILE_TABLE)

  console.log(`\nLayer: reference (${tables.length} tables)`)
  console.log(`  ${endpoints.sourceRef} -> ${endpoints.targetRef}`)
  if (!options.includeExecProfiles) {
    console.log(`  Skipping ${EXEC_PROFILE_TABLE} (real named people). Pass --include-exec-profiles to copy it.`)
  }
  console.log('')

  const results = []
  for (const table of tables) {
    const result = await copyTable(source, target, table, options)
    results.push(result)
    const verb = options.apply ? 'copied' : 'would copy'
    if (result.ok) {
      console.log(`  ${result.ok ? 'ok  ' : 'fail'} ${table.padEnd(24)} ${verb} ${result.copied}`)
    } else {
      console.log(`  fail ${table.padEnd(24)} ${result.message}`)
    }
  }

  const failed = results.filter((r) => !r.ok)
  const total = results.reduce((sum, r) => sum + r.copied, 0)
  console.log(`\n  ${options.apply ? 'Copied' : 'Would copy'} ${total} rows across ${results.length} tables.`)
  if (failed.length > 0) {
    console.log(`  ${failed.length} table(s) failed.`)
  }
  return failed.length === 0
}

function runDelegated(label, command, args, endpoints, options) {
  console.log(`\nLayer: ${label}`)

  if (!options.apply) {
    console.log(`  Dry run. Would run: ${command} ${args.join(' ')}`)
    console.log(`  Target: ${endpoints.targetRef}`)
    return true
  }

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      // Point the delegated script at the target project rather than whatever
      // its own env happens to resolve to.
      NEXT_PUBLIC_SUPABASE_URL: endpoints.targetUrl,
      SUPABASE_SERVICE_ROLE_KEY: endpoints.targetKey,
    },
  })

  if (result.error) {
    console.log(`  Failed to start: ${result.error.message}`)
    return false
  }
  return result.status === 0
}

async function main() {
  const options = parseArgs(process.argv)
  const endpoints = resolveEndpoints()

  console.log(`Staging seed (${options.apply ? 'APPLY' : 'dry run'})`)
  console.log(`  source ${endpoints.sourceRef}`)
  console.log(`  target ${endpoints.targetRef}`)
  if (options.limit) console.log(`  limit  ${options.limit} rows per table`)

  const wanted = options.layer === 'all' ? LAYERS : [options.layer]
  let ok = true

  if (wanted.includes('reference')) {
    ok = (await runReferenceLayer(endpoints, options)) && ok
  }

  if (wanted.includes('fixtures')) {
    ok = runDelegated('fixtures', 'npx', ['tsx', 'scripts/seed-demo.ts'], endpoints, options) && ok
  }

  if (wanted.includes('probe')) {
    ok =
      runDelegated('probe', 'node', ['scripts/reset-probe-account.mjs'], endpoints, options) && ok
  }

  console.log('')
  if (!options.apply) {
    console.log('Dry run complete. Re-run with --apply to write.')
  } else {
    console.log(ok ? 'Seed complete.' : 'Seed finished with failures.')
  }

  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(`\nseed-staging failed: ${error.message}`)
  process.exit(1)
})
