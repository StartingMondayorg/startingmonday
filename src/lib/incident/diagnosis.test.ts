import { describe, expect, it } from 'vitest'
import { assertPublishable, extractJson, parseDiagnosis, renderThreadMessage } from './diagnosis'

const valid = {
  verdict: 'code-fix',
  summary: 'Null company on the dashboard signals query.',
  reasoning: 'The handler assumes at least one company row exists.',
  files: ['src/app/api/(dashboard)/signals/route.ts'],
}

describe('extractJson', () => {
  it('reads a bare object', () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}')
  })

  it('reads an object wrapped in prose and fences, which models do routinely', () => {
    const raw = 'Here is my analysis:\n```json\n{"a":1,"b":{"c":2}}\n```\nHope that helps.'
    expect(extractJson(raw)).toBe('{"a":1,"b":{"c":2}}')
  })

  it('does not stop at a brace inside a string literal', () => {
    // A summary mentioning "}" would otherwise truncate the object.
    const raw = '{"summary":"unbalanced } brace","verdict":"code-fix"}'
    expect(extractJson(raw)).toBe(raw)
  })

  it('handles an escaped quote inside a string', () => {
    const raw = String.raw`{"summary":"he said \"hi\"","x":1}`
    expect(extractJson(raw)).toBe(raw)
  })

  it('returns null when there is no object', () => {
    expect(extractJson('I could not determine a cause.')).toBeNull()
  })
})

describe('parseDiagnosis', () => {
  it('accepts a well-formed diagnosis', () => {
    const result = parseDiagnosis(JSON.stringify(valid))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.diagnosis.verdict).toBe('code-fix')
  })

  it('accepts every allowed verdict, so a negative result is not second-class', () => {
    for (const verdict of ['code-fix', 'not-code-fixable', 'insufficient-evidence']) {
      expect(parseDiagnosis(JSON.stringify({ ...valid, verdict })).ok).toBe(true)
    }
  })

  it('rejects an invented verdict', () => {
    const r = parseDiagnosis(JSON.stringify({ ...valid, verdict: 'probably-fine' }))
    expect(r).toMatchObject({ ok: false })
  })

  it('requires reasoning even for not-code-fixable', () => {
    // Otherwise "not-code-fixable" is a free pass for anything that looks hard.
    const r = parseDiagnosis(JSON.stringify({ ...valid, verdict: 'not-code-fixable', reasoning: '  ' }))
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('reasoning') })
  })

  it('requires a summary', () => {
    const r = parseDiagnosis(JSON.stringify({ ...valid, summary: '' }))
    expect(r).toMatchObject({ ok: false })
  })

  it('reports malformed JSON rather than throwing', () => {
    expect(parseDiagnosis('{"verdict": ')).toMatchObject({ ok: false })
  })

  it('tolerates a missing files array', () => {
    const withoutFiles = { ...valid, files: undefined }
    const r = parseDiagnosis(JSON.stringify(withoutFiles))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.diagnosis.files).toEqual([])
  })

  it('drops non-string entries from files', () => {
    const r = parseDiagnosis(JSON.stringify({ ...valid, files: ['a.ts', 42, null] }))
    if (r.ok) expect(r.diagnosis.files).toEqual(['a.ts'])
  })
})

function parsed(overrides: Record<string, unknown> = {}) {
  const result = parseDiagnosis(JSON.stringify({ ...valid, ...overrides }))
  if (!result.ok) throw new Error(`fixture invalid: ${result.error}`)
  return result.diagnosis
}

describe('renderThreadMessage', () => {
  it('includes the verdict, summary and reasoning', () => {
    const text = renderThreadMessage({ diagnosis: parsed(), alertClass: 'app-error-new' })
    expect(text).toContain('Code fix identified')
    expect(text).toContain(valid.summary)
    expect(text).toContain(valid.reasoning)
  })

  it('marks a dry run so nobody waits for a PR that is not coming', () => {
    expect(renderThreadMessage({ diagnosis: parsed(), alertClass: 'x', dryRun: true }))
      .toContain('Dry run')
  })

  it('caps length so Slack never rejects the post', () => {
    const text = renderThreadMessage({ diagnosis: parsed({ reasoning: 'x'.repeat(9000) }), alertClass: 'x' })
    expect(text.length).toBeLessThanOrEqual(3820)
    expect(text).toContain('truncated')
  })
})

describe('assertPublishable', () => {
  it('passes clean output', () => {
    expect(assertPublishable('Null company on the signals query, src/app/x.ts:12')).toEqual({ safe: true })
  })

  it('blocks output containing an email address', () => {
    const r = assertPublishable('failed for someone@example.com')
    expect(r).toMatchObject({ safe: false })
    if (!r.safe) expect(r.hits).toContain('email')
  })

  it('blocks output containing an internal hostname', () => {
    expect(assertPublishable('dialled worker.railway.internal')).toMatchObject({ safe: false })
  })

  it('does not block git SHAs or file paths, which are the useful evidence', () => {
    expect(assertPublishable('63b5144c9f2a1e8d7b3c4a5e6f7089ab12cd34ef in src/lib/x.ts')).toEqual({ safe: true })
  })
})
