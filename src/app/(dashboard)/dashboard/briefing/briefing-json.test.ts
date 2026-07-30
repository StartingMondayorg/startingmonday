import { describe, expect, it } from 'vitest'
import { parseBriefingJson } from './briefing-json'

describe('parseBriefingJson', () => {
  it('parses strict JSON inside an optional markdown fence', () => {
    expect(parseBriefingJson('```json\n{"intro":"Ready"}\n```')).toEqual({ intro: 'Ready' })
  })

  it('repairs trailing commas without changing commas inside strings', () => {
    expect(parseBriefingJson('{"intro":"First, act", "signalAlerts":[{"company":"Acme",}],}')).toEqual({
      intro: 'First, act',
      signalAlerts: [{ company: 'Acme' }],
    })
  })

  it('rejects malformed or non-object output', () => {
    expect(parseBriefingJson('{intro: "Ready"}')).toBeNull()
    expect(parseBriefingJson('[]')).toBeNull()
  })
})