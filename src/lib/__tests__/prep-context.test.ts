import { describe, it, expect } from 'vitest'
import {
  buildScanSection,
  buildSignalSection,
  buildContactSection,
  buildDocSection,
} from '@/lib/prep/prep-context'

describe('buildScanSection', () => {
  it('returns default text when no scan results', () => {
    expect(buildScanSection(null)).toContain('No career page scan on file.')
    expect(buildScanSection([])).toContain('No career page scan on file.')
  })

  it('reports scan with no matching roles', () => {
    const result = buildScanSection([{ scanned_at: '2024-01-15T10:00:00Z', raw_hits: [] }])
    expect(result).toContain('January 15')
    expect(result).toContain('No matching roles found')
  })

  it('lists only matching roles with scores and summaries', () => {
    const result = buildScanSection([{
      scanned_at: '2024-03-01T10:00:00Z',
      raw_hits: [
        { title: 'CTO', score: 9, is_match: true, summary: 'Strong technical leadership fit' },
        { title: 'VP Engineering', score: 5, is_match: false, summary: 'Partial fit' },
      ],
    }])
    expect(result).toContain('CTO')
    expect(result).toContain('fit score: 9')
    expect(result).toContain('Strong technical leadership fit')
    expect(result).not.toContain('VP Engineering')
  })

  it('uses only the most recent scan when multiple exist', () => {
    const result = buildScanSection([
      { scanned_at: '2024-03-10T00:00:00Z', raw_hits: [] },
      { scanned_at: '2024-01-01T00:00:00Z', raw_hits: [] },
    ])
    expect(result).toContain('March 10')
    expect(result).not.toContain('January 1')
  })

  it('uses COO-specific fallback emphasizing M&A and operational announcements', () => {
    const result = buildScanSection([], 'coo')
    expect(result).toContain('COO mandates are created around specific operational challenges')
    expect(result).toContain('M&A and operational-announcement signals')
  })
})

describe('buildSignalSection', () => {
  it('returns null when no signals', () => {
    expect(buildSignalSection(null)).toBeNull()
    expect(buildSignalSection([])).toBeNull()
  })

  it('uppercases signal type and formats date', () => {
    const result = buildSignalSection([{
      signal_type: 'funding',
      signal_summary: 'Raised $50M Series B',
      signal_date: '2024-03-15',
    }])
    expect(result).toContain('[FUNDING]')
    expect(result).toContain('Raised $50M Series B')
    expect(result).toContain('2024')
  })

  it('appends outreach angle when present', () => {
    const result = buildSignalSection([{
      signal_type: 'news',
      signal_summary: 'Expanded to Europe',
      outreach_angle: 'International scale experience',
      signal_date: '2024-03-01',
    }])
    expect(result).toContain('Angle: International scale experience')
  })

  it('omits angle line when outreach_angle is null', () => {
    const result = buildSignalSection([{
      signal_type: 'news',
      signal_summary: 'New product launch',
      outreach_angle: null,
      signal_date: '2024-03-01',
    }])
    expect(result).not.toContain('Angle:')
  })

  it('joins multiple signals with newlines', () => {
    const result = buildSignalSection([
      { signal_type: 'funding', signal_summary: 'Series A', signal_date: '2024-01-01' },
      { signal_type: 'news', signal_summary: 'New hire', signal_date: '2024-02-01' },
    ])
    expect(result?.split('\n').filter(l => l.startsWith('- [')).length).toBe(2)
  })
})

describe('buildContactSection', () => {
  it('returns default text when no contacts', () => {
    expect(buildContactSection(null)).toBe('No contacts on file.')
    expect(buildContactSection([])).toBe('No contacts on file.')
  })

  it('formats name with title and firm', () => {
    const result = buildContactSection([{
      name: 'Jane Smith',
      title: 'CTO',
      firm: 'Acme Corp',
      channel: null,
      notes: null,
    }])
    expect(result).toContain('Jane Smith')
    expect(result).toContain('CTO at Acme Corp')
  })

  it('appends channel and notes when present', () => {
    const result = buildContactSection([{
      name: 'Bob Jones',
      title: null,
      firm: null,
      channel: 'LinkedIn',
      notes: 'Met at conference',
    }])
    expect(result).toContain('via LinkedIn')
    expect(result).toContain('Met at conference')
  })

  it('handles contact with name only', () => {
    const result = buildContactSection([{
      name: 'Alex Chen',
      title: null,
      firm: null,
      channel: null,
      notes: null,
    }])
    expect(result).toBe('- Alex Chen')
  })

  it('formats multiple contacts as separate lines', () => {
    const result = buildContactSection([
      { name: 'Alice', title: null, firm: null, channel: null, notes: null },
      { name: 'Bob', title: null, firm: null, channel: null, notes: null },
    ])
    const lines = result.split('\n')
    expect(lines).toHaveLength(2)
  })
})

describe('buildDocSection', () => {
  it('returns null when no documents', () => {
    expect(buildDocSection(null)).toBeNull()
    expect(buildDocSection([])).toBeNull()
  })

  it('maps label keys to human-readable names', () => {
    const result = buildDocSection([{ label: 'job_description', content: 'We are looking for...' }])
    expect(result).toContain('[Job Description]')

    const result2 = buildDocSection([{ label: 'annual_report', content: 'Fiscal year...' }])
    expect(result2).toContain('[Annual Report]')
  })

  it('falls back to raw label for unknown label keys', () => {
    const result = buildDocSection([{ label: 'custom_type', content: 'Content here' }])
    expect(result).toContain('[custom_type]')
  })

  it('truncates content exceeding DOC_CHARS and appends marker', () => {
    const longContent = 'a'.repeat(5000)
    const result = buildDocSection([{ label: 'other', content: longContent }])
    expect(result).toContain('[truncated]')
  })

  it('does not truncate content within DOC_CHARS limit', () => {
    const shortContent = 'Short document content.'
    const result = buildDocSection([{ label: 'other', content: shortContent }])
    expect(result).toContain(shortContent)
    expect(result).not.toContain('[truncated]')
  })

  it('separates multiple documents with double newline', () => {
    const result = buildDocSection([
      { label: 'job_description', content: 'JD content' },
      { label: 'news', content: 'News content' },
    ])
    expect(result).toContain('[Job Description]')
    expect(result).toContain('[News & Press]')
    expect(result?.includes('\n\n')).toBe(true)
  })
})
