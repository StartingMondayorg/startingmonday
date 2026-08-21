import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../../', import.meta.url)

function source(path: string) {
  return readFileSync(new URL(path, root), 'utf8')
}

describe('WS7-10 no-contact and no-provider boundary', () => {
  it('keeps the count table free of contact, query, URL, and payload columns', () => {
    const migration = source('supabase/migrations/178_live_brief_handoff_metrics.sql')
    const columns = migration.match(/create table[^]*?\(([^]*?)\n\);/)?.[1] ?? ''

    expect(columns).not.toMatch(/\b(email|phone|name|query|url|payload|metadata)\b/i)
    expect(columns).toContain("destination in ('linkedin', 'apollo')")
  })

  it('contains no provider API request or cross-product runtime dependency', () => {
    const runtime = [
      source('src/lib/people-to-know-handoff.ts'),
      source('src/app/live-brief/[token]/people-to-know-section.tsx'),
      source('src/app/api/live-brief/[token]/events/route.ts'),
    ].join('\n')

    expect(runtime).not.toMatch(/api\.apollo\.io|fetch\(\s*['"`]https?:\/\/(?:www\.)?(?:linkedin|apollo)/i)
    expect(runtime).not.toMatch(/mandatesignal|contact_reveals|reveal_credit_ledger/i)
  })
})