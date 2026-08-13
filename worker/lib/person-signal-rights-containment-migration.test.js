import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/173_person_signal_rights_containment.sql'),
  'utf8',
)

describe('person signal rights containment migration', () => {
  it('removes all four global authenticated read policies', () => {
    for (const policy of [
      'Authenticated can read people',
      'Authenticated can read person sources',
      'Authenticated can read person affiliations',
      'Authenticated can read person signals',
    ]) {
      expect(migration).toContain(`drop policy if exists "${policy}"`)
    }
  })

  it('scopes every replacement policy through user-owned relationship links', () => {
    expect(migration.match(/link\.user_id = auth\.uid\(\)/g)).toHaveLength(4)
    expect(migration.match(/candidate\.user_id = auth\.uid\(\)/g)).toHaveLength(4)
    expect(migration.match(/create policy "Users read linked/g)).toHaveLength(4)
  })

  it('does not add global authenticated predicates', () => {
    expect(migration).not.toMatch(/using \(true\)/i)
  })
})