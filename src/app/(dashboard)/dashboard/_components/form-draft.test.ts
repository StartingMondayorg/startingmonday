import { describe, expect, it } from 'vitest'
import { draftDiffers, isDraftableField, parseDraft, serializeDraft } from './form-draft'

describe('form draft helpers', () => {
  it('skips secrets, files, hidden and button-like fields', () => {
    expect(isDraftableField({ name: 'password', type: 'password' })).toBe(false)
    expect(isDraftableField({ name: 'resume', type: 'file' })).toBe(false)
    expect(isDraftableField({ name: 'csrf', type: 'hidden' })).toBe(false)
    expect(isDraftableField({ name: '', type: 'text' })).toBe(false)
    expect(isDraftableField({ name: 'full_name', type: 'text' })).toBe(true)
    expect(isDraftableField({ name: 'notes', type: 'textarea' })).toBe(true)
  })

  it('serializes text, select, radio and checkbox groups', () => {
    const draft = serializeDraft([
      { name: 'full_name', type: 'text', value: 'Priya' },
      { name: 'size', type: 'select', value: 'large' },
      { name: 'posture', type: 'radio', value: 'active', checked: false },
      { name: 'posture', type: 'radio', value: 'exploring', checked: true },
      { name: 'days', type: 'checkbox', value: 'Mon', checked: true },
      { name: 'days', type: 'checkbox', value: 'Tue', checked: false },
      { name: 'days', type: 'checkbox', value: 'Wed', checked: true },
      { name: 'token', type: 'hidden', value: 'x' },
    ])
    expect(draft).toEqual({ full_name: 'Priya', size: 'large', posture: 'exploring', days: ['Mon', 'Wed'] })
  })

  it('detects whether a stored draft differs from the rendered values', () => {
    const current = { full_name: 'Priya', days: ['Mon', 'Wed'] }
    expect(draftDiffers({ full_name: 'Priya', days: ['Wed', 'Mon'] }, current)).toBe(false)
    expect(draftDiffers({ full_name: 'Priya N.', days: ['Mon', 'Wed'] }, current)).toBe(true)
    expect(draftDiffers({ full_name: 'Priya', days: ['Mon'] }, current)).toBe(true)
    expect(draftDiffers({ full_name: 'Priya', days: ['Mon', 'Wed'], notes: '' }, current)).toBe(false)
  })

  it('parses only JSON objects', () => {
    expect(parseDraft(null)).toBeNull()
    expect(parseDraft('not json')).toBeNull()
    expect(parseDraft('[1,2]')).toBeNull()
    expect(parseDraft('{"a":"b"}')).toEqual({ a: 'b' })
  })
})
