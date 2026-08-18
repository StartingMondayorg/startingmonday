import { describe, expect, it } from 'vitest'
import {
  PREP_SYSTEM,
  STRATEGY_SYSTEM,
  buildChatSystemPrompt,
  personaContext,
  roleTypeContext,
} from './prompts'

describe('prompts module', () => {
  it('exports core prompt constants', () => {
    expect(typeof PREP_SYSTEM).toBe('string')
    expect(typeof STRATEGY_SYSTEM).toBe('string')
    expect(PREP_SYSTEM.length).toBeGreaterThan(100)
  })

  it('exports context helpers', () => {
    expect(typeof personaContext('csuite')).toBe('string')
    expect(typeof roleTypeContext('cio')).toBe('string')
    expect(typeof buildChatSystemPrompt({
      name: 'Example User',
      today: '2026-05-24',
      isDemo: false,
      profileLines: '',
      pipelineLines: '',
      contactLines: '',
      actionsLines: '',
      companiesCount: 0,
      contactsCount: 0,
    })).toBe('string')
  })
})