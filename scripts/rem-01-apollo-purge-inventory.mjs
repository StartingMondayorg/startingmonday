import fs from 'node:fs/promises'
import path from 'node:path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))
const defaultOutput = path.join(
  'tmp',
  `rem-01-apollo-purge-inventory-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
)
const outputPath = outputArg ? outputArg.slice('--output='.length) : defaultOutput

const targets = [
  { table: 'people', column: 'source_primary', value: 'apollo' },
  { table: 'company_people_candidates', column: 'source', value: 'apollo' },
  { table: 'person_sources', column: 'source_type', value: 'apollo' },
  { table: 'contact_people', column: 'source', value: 'apollo' },
]

function buildUrl(target, query = 'select=id') {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${target.table}`)
  url.searchParams.set(target.column, `eq.${target.value}`)
  for (const [k, v] of new URLSearchParams(query).entries()) {
    url.searchParams.set(k, v)
  }
  return url.toString()
}

function parseCountHeader(value) {
  if (!value) return null
  const parts = value.split('/')
  if (parts.length !== 2) return null
  const count = Number(parts[1])
  return Number.isFinite(count) ? count : null
}

async function restRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.headers ?? {}),
    },
  })

  return response
}

async function countRows(target) {
  const response = await restRequest(buildUrl(target, 'select=id&limit=1'), {
    method: 'GET',
    headers: {
      Prefer: 'count=exact',
      Range: '0-0',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    return { ok: false, error: body || response.statusText, count: null }
  }

  return { ok: true, count: parseCountHeader(response.headers.get('content-range')) ?? 0, error: null }
}

async function purgeRows(target) {
  const response = await restRequest(buildUrl(target), {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    return { ok: false, error: body || response.statusText }
  }

  return { ok: true, error: null }
}

async function run() {
  const before = []
  for (const target of targets) {
    const result = await countRows(target)
    before.push({ ...target, ...result })
  }

  const purge = []
  if (APPLY) {
    for (const target of targets) {
      const result = await purgeRows(target)
      purge.push({ ...target, ...result })
    }
  }

  const after = []
  for (const target of targets) {
    const result = await countRows(target)
    after.push({ ...target, ...result })
  }

  const deleted = targets.map((target) => {
    const b = before.find((row) => row.table === target.table && row.column === target.column)
    const a = after.find((row) => row.table === target.table && row.column === target.column)
    const deletedCount =
      typeof b?.count === 'number' && typeof a?.count === 'number'
        ? Math.max(0, b.count - a.count)
        : null

    return {
      ...target,
      deleted: deletedCount,
      before_ok: Boolean(b?.ok),
      after_ok: Boolean(a?.ok),
    }
  })

  const payload = {
    spec: 'REM-01 Apollo purge inventory',
    ranAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    before,
    purge,
    after,
    deleted,
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({
    ok: true,
    mode: payload.mode,
    outputPath,
    deleted,
  }, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
