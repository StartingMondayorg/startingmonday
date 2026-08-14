import { describe, expect, it } from 'vitest'
import { numOrNull, str } from './form-utils'

describe('form-utils', () => {
  it('normalizes strings and finite numbers', () => {
    const form = new FormData()
    form.set('name', '  Rich  ')
    form.set('score', '42')
    form.set('bad', 'not-a-number')
    expect(str(form, 'name')).toBe('Rich')
    expect(numOrNull(form, 'score')).toBe(42)
    expect(numOrNull(form, 'bad')).toBeNull()
  })
})
