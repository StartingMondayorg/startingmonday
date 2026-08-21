// Integration test — WBS 1.3.9
// Creates a temporary test user, scans 5 real career pages, reports DB results.
// Run from repo root: node scripts/test-scanner.mjs
// Cleanup: node scripts/test-scanner.mjs --cleanup

import { createClient } from '@supabase/supabase-js'
import { scanCompany } from '../worker/scanner/scan-company.js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), '../../.env.local') })

const TEST_EMAIL = 'scanner-test@startingmonday.internal'
const TEST_PASSWORD = 'test-scanner-12345'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Greenhouse boards render job listings as plain HTML — ideal for testing without browserless.io
const TEST_COMPANIES = [
  { name: 'Anthropic',   career_page_url: 'https://boards.greenhouse.io/anthropic' },
  { name: 'Flexport',    career_page_url: 'https://boards.greenhouse.io/flexport' },
  { name: 'HubSpot',     career_page_url: 'https://boards.greenhouse.io/hubspot' },
  { name: 'ServiceNow',  career_page_url: 'https://boards.greenhouse.io/servicenow' },
  { name: 'Stripe',      career_page_url: 'https://boards.greenhouse.io/stripe' },
]

const TEST_PROFILE = {
  full_name: 'Test User',
  target_titles: ['VP of Engineering', 'VP of Technology', 'Director of Engineering', 'CTO', 'Head of Engineering'],
  target_sectors: ['Technology', 'SaaS', 'FinTech'],
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanup() {
  console.log('\nCleaning up test data...')
  const { data: user } = await supabase.auth.admin.listUsers()
  const testUser = user?.users?.find(u => u.email === TEST_EMAIL)
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id)
    console.log('✓ Test user deleted')
  } else {
    console.log('  No test user found')
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

async function getOrCreateTestUser() {
  // Check if already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === TEST_EMAIL)
  if (found) {
    console.log('  Reusing existing test user:', found.id)
    return found.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  console.log('  Created test user:', data.user.id)
  return data.user.id
}

async function setupProfile(userId) {
  const { error } = await supabase
    .from('user_profiles')
    .update(TEST_PROFILE)
    .eq('user_id', userId)
  if (error) throw new Error(`Failed to update profile: ${error.message}`)
}

async function createCompanies(userId) {
  // Remove existing test companies first
  await supabase.from('companies').delete().eq('user_id', userId)

  const rows = TEST_COMPANIES.map(c => ({ ...c, user_id: userId }))
  const { data, error } = await supabase.from('companies').insert(rows).select()
  if (error) throw new Error(`Failed to create companies: ${error.message}`)
  return data
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (process.argv.includes('--cleanup')) {
    await cleanup()
    return
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars — check .env.local')
    process.exit(1)
  }

  console.log('\n=== Starting Monday — Scanner Integration Test ===\n')

  // Setup
  console.log('Setting up test data...')
  const userId = await getOrCreateTestUser()
  await setupProfile(userId)
  const companies = await createCompanies(userId)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  console.log(`✓ Profile: [${TEST_PROFILE.target_titles.slice(0, 2).join(', ')}...]`)
  console.log(`✓ ${companies.length} companies created\n`)

  // Scan each company
  const results = []
  for (const company of companies) {
    const start = Date.now()
    const result = await scanCompany(supabase, company, profile)
    results.push({ company: company.name, ...result, ms: Date.now() - start })
    console.log('')
  }

  // Report DB results
  console.log('\n=== Results in DB ===\n')
  const { data: scanResults } = await supabase
    .from('scan_results')
    .select('*')
    .eq('user_id', userId)
    .order('ai_score', { ascending: false })

  const successes = scanResults?.filter(r => r.status === 'success') ?? []
  const errors = scanResults?.filter(r => r.status === 'error') ?? []

  if (!successes.length) {
    console.log('No successful scans (career pages may need JavaScript rendering — get browserless.io key)')
  } else {
    console.log(`${successes.length} scan(s) written:\n`)
    for (const r of successes) {
      const company = companies.find(c => c.id === r.company_id)?.name ?? r.company_id
      const hits = r.raw_hits ?? []
      const matches = hits.filter(h => h.is_match)
      console.log(`  ${company} — score: ${r.ai_score}, ${matches.length} match(es) of ${hits.length} detected`)
      for (const h of matches) {
        console.log(`    ✓ "${h.title}" (${h.score}) — ${h.summary}`)
      }
      if (!matches.length && hits.length) {
        console.log(`    (no matches — ${hits.map(h => `"${h.title}"`).join(', ')})`)
      }
      if (!hits.length) {
        console.log(`    (no candidates detected — page may require JS rendering)`)
      }
    }
  }

  if (errors.length) {
    console.log(`\n${errors.length} scan error(s):`)
    for (const e of errors) {
      const company = companies.find(c => c.id === e.company_id)?.name ?? e.company_id
      console.log(`  ✗ ${company}: ${e.error_message}`)
    }
  }

  console.log('\nRun with --cleanup to remove test data.')
}

run().catch(err => {
  console.error('\nFatal:', err.message)
  process.exit(1)
})
