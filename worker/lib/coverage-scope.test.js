import { describe, expect, it } from 'vitest'
import { isUiShellFile, isUnitCoverageSourceFile } from '../../scripts/lib/coverage-scope.mjs'

describe('coverage scope ownership', () => {
  it('assigns non-API React UI shells to browser and visual gates', () => {
    expect(isUiShellFile('src/app/(dashboard)/dashboard/page.tsx')).toBe(true)
    expect(isUiShellFile('src/app/onboarding/onboarding-form.tsx')).toBe(true)
    expect(isUiShellFile('src/components/ui/button.tsx')).toBe(true)
    expect(isUnitCoverageSourceFile('src/app/(auth)/login/page.tsx')).toBe(false)
  })

  it('keeps API and library logic in unit coverage scope', () => {
    expect(isUiShellFile('src/app/api/health/route.ts')).toBe(false)
    expect(isUnitCoverageSourceFile('src/app/api/health/route.ts')).toBe(true)
    expect(isUnitCoverageSourceFile('src/lib/dashboard-posture.ts')).toBe(true)
  })

  it('excludes test files from shipped-code coverage denominators', () => {
    expect(isUnitCoverageSourceFile('src/lib/dashboard-posture.test.ts')).toBe(false)
    expect(isUnitCoverageSourceFile('src/app/api/__tests__/route.ts')).toBe(false)
  })
})