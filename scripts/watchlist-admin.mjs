#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { runWatchlistScan } from '../worker/jobs/watchlist-scan-job.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PROVIDERS = new Set(['greenhouse', 'lever', 'ashby'])

function usage(message = null) {
  if (message) console.error(`Error: ${message}\n`)
  console.error([
    'Usage:',
    '  node scripts/watchlist-admin.mjs create --name "John Dunn CT territory" [--description "..."]',
    '  node scripts/watchlist-admin.mjs list',
    '  node scripts/watchlist-admin.mjs add --watchlist <uuid> --company "Acme" [--domain acme.com] [--state CT] [--cik 0001234567] [--ats-provider greenhouse --ats-token acme]',
    '  node scripts/watchlist-admin.mjs scan --watchlist <uuid>',
  ].join('\n'))
  process.exit(2)
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const values = {}
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]
    if (!arg.startsWith('--')) usage(`Unknown argument: ${arg}`)
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    const value = rest[i + 1]
    if (!value || value.startsWith('--')) usage(`Missing value for --${arg.slice(2)}`)
    values[key] = value
    i += 1
  }
  return { command, values }
}

function required(values, key) {
  const value = values[key]?.trim()
  if (!value) usage(`--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} is required`)
  return value
}

function uuid(value, key) {
  if (!UUID_RE.test(value)) usage(`--${key} must be a UUID`)
  return value
}

function optional(values, key, maxLength) {
  const value = values[key]?.trim()
  if (!value) return null
  if (value.length > maxLength) usage(`--${key} exceeds ${maxLength} characters`)
  return value
}

function createAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function createWatchlist(admin, values) {
  const name = required(values, 'name')
  const { data, error } = await admin.from('watchlists').insert({
    name,
    description: optional(values, 'description', 2000),
  }).select('id,name,description,active,created_at').single()
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))
}

async function listWatchlists(admin) {
  const { data, error } = await admin.from('watchlists')
    .select('id,name,description,active,created_at,watchlist_entries(id,company_name,state,domain,ats_provider,ats_board_token,active)')
    .order('created_at', { ascending: false })
  if (error) throw error
  console.log(JSON.stringify(data ?? [], null, 2))
}

async function addEntry(admin, values) {
  const watchlistId = uuid(required(values, 'watchlist'), 'watchlist')
  const companyName = required(values, 'company')
  const provider = optional(values, 'atsProvider', 32)
  if (provider && !PROVIDERS.has(provider)) usage('--ats-provider must be greenhouse, lever, or ashby')
  const state = optional(values, 'state', 2)?.toUpperCase() ?? null
  if (state && !/^[A-Z]{2}$/.test(state)) usage('--state must be a two-letter state code')
  const cik = optional(values, 'cik', 10)
  if (cik && !/^\d{10}$/.test(cik)) usage('--cik must be a ten-digit padded SEC CIK')
  if (provider && !optional(values, 'atsToken', 240)) usage('--ats-token is required when --ats-provider is supplied')

  const { data, error } = await admin.from('watchlist_entries').insert({
    watchlist_id: watchlistId,
    company_name: companyName,
    domain: optional(values, 'domain', 240),
    sec_cik_padded: cik,
    state,
    ats_provider: provider,
    ats_board_token: optional(values, 'atsToken', 240),
  }).select('id,watchlist_id,company_name,domain,sec_cik_padded,state,ats_provider,ats_board_token,active').single()
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))
}

async function scanWatchlist(admin, values) {
  const watchlistId = uuid(required(values, 'watchlist'), 'watchlist')
  const result = await runWatchlistScan(admin, watchlistId)
  console.log(JSON.stringify(result, null, 2))
}

const { command, values } = parseArgs(process.argv.slice(2))
if (!new Set(['create', 'list', 'add', 'scan']).has(command)) usage('command must be create, list, add, or scan')

try {
  const admin = createAdmin()
  if (command === 'create') await createWatchlist(admin, values)
  else if (command === 'list') await listWatchlists(admin)
  else if (command === 'add') await addEntry(admin, values)
  else await scanWatchlist(admin, values)
} catch (error) {
  console.error(`Watchlist operation failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
