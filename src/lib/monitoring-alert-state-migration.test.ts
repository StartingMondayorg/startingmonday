import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readRepoFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('monitoring alert state migration contract', () => {
  const createMigration = readRepoFile('supabase/migrations/132_monitoring_alert_state.sql')
  const hardeningMigration = readRepoFile('supabase/migrations/167_monitoring_alert_state_compat_rls.sql')
  const compatibilityRoute = readRepoFile('src/app/api/cron/apollo-quality-audit/route.ts')
  const deploymentWorkflow = readRepoFile('.github/workflows/apply-monitoring-alert-state-migration.yml')

  it('allows the status written by compatibility telemetry', () => {
    const writtenStatus = compatibilityRoute.match(/last_status:\s*'([^']+)'/)?.[1]

    expect(writtenStatus).toBe('deprecated-route-hit')
    expect(createMigration).toContain(`'${writtenStatus}'`)
    expect(hardeningMigration).toContain(`'${writtenStatus}'`)
  })

  it('enables RLS in both fresh and forward-fix migrations', () => {
    expect(createMigration).toMatch(/alter table public\.monitoring_alert_state enable row level security/i)
    expect(hardeningMigration).toMatch(/alter table if exists public\.monitoring_alert_state enable row level security/i)
  })

  it('keeps the production workflow fixed to the reviewed migrations and main', () => {
    expect(deploymentWorkflow).toContain("github.ref == 'refs/heads/main'")
    expect(deploymentWorkflow).toContain('132_monitoring_alert_state.sql')
    expect(deploymentWorkflow).toContain('167_monitoring_alert_state_compat_rls.sql')
    expect(deploymentWorkflow).toContain('mytnhoxcgvnzxhgcumkf')
    expect(deploymentWorkflow).toContain("alert_key = 'apollo-quality-audit-compat-hit'")
  })
})