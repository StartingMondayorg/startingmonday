import { describe, expect, it } from 'vitest'
import { getRoleModePromptPack, isPrepRoleMode } from '@/lib/prep/prep-role-modes'

describe('prep role modes', () => {
  it('accepts known role modes', () => {
    expect(isPrepRoleMode('cio')).toBe(true)
    expect(isPrepRoleMode('vp_to_cxo')).toBe(true)
    expect(isPrepRoleMode('unknown')).toBe(false)
  })

  it('returns mode-specific prompt pack text', () => {
    const pack = getRoleModePromptPack('ciso')
    expect(pack).toContain('ROLE MODE: CISO')
  })
})
