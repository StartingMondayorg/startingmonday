import { describe, expect, it } from 'vitest'
import { isInterviewPrepEmpty, parseInterviewPrepForm, toDateTimeLocalValue } from './interview-prep-form'

function form(entries: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

describe('parseInterviewPrepForm', () => {
  it('reads the role fields and only the known answer keys', () => {
    const input = parseInterviewPrepForm(form({
      company_name: '  Figma ',
      role_title: 'VP Engineering',
      interview_at: '2026-10-28T14:30',
      positioning: 'Platform leader who scales teams.',
      objection: 'No fintech background',
      bogus: 'ignored',
      status: 'saved',
    }))
    expect(input.companyName).toBe('Figma')
    expect(input.roleTitle).toBe('VP Engineering')
    expect(input.interviewAt).toBe('2026-10-28T14:30:00.000Z')
    expect(input.answers).toEqual({ positioning: 'Platform leader who scales teams.', objection: 'No fintech background' })
    expect(input.status).toBe('saved')
    expect(input.id).toBeNull()
  })

  it('defaults to draft, drops blank answers and bad dates, and ignores non-uuid ids', () => {
    const input = parseInterviewPrepForm(form({ id: 'nope', interview_at: 'next tuesday', why_now: '   ' }))
    expect(input.status).toBe('draft')
    expect(input.interviewAt).toBeNull()
    expect(input.answers).toEqual({})
    expect(input.id).toBeNull()
    expect(isInterviewPrepEmpty(input)).toBe(true)
  })

  it('keeps a well-formed id for updates', () => {
    const id = '8a1f6c5e-2b3d-4e5f-9a0b-1c2d3e4f5a6b'
    expect(parseInterviewPrepForm(form({ id, role_fit: 'x' })).id).toBe(id)
  })

  it('caps long answers', () => {
    const input = parseInterviewPrepForm(form({ positioning: 'a'.repeat(5000) }))
    expect(input.answers.positioning?.length).toBe(4000)
  })
})

describe('toDateTimeLocalValue', () => {
  it('round-trips a stored value into the datetime-local format', () => {
    expect(toDateTimeLocalValue('2026-10-28T14:30:00.000Z')).toBe('2026-10-28T14:30')
    expect(toDateTimeLocalValue(null)).toBe('')
    expect(toDateTimeLocalValue('garbage')).toBe('')
  })
})
