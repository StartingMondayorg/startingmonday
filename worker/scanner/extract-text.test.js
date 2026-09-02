import { describe, it, expect } from 'vitest'
import {
  extractText,
  normalizeText,
  textShape,
  isDegenerateTextShape,
  DEGENERATE_MIN_CHARS,
} from './extract-text.js'
import { detectRoles } from './detect-roles.js'

// A serialized/minified DOM: zero newlines anywhere, titles in sibling
// elements. This is what browserless /chromium/content returns for a
// client-rendered career board (the SMK-489 failure class).
const MINIFIED_CAREER_PAGE =
  '<html><head><title>Careers</title></head><body>' +
  '<div id="app"><h1>Open Roles</h1><ul>' +
  '<li><a href="/jobs/1">VP of Engineering</a></li>' +
  '<li><a href="/jobs/2">Chief Technology Officer</a></li>' +
  '<li><a href="/jobs/3">Director of Platform Operations</a></li>' +
  '<li><a href="/jobs/4">Account Executive</a></li>' +
  '</ul><p>Join us. We are hiring across the company.</p></div>' +
  '</body></html>'

describe('extractText whitespace independence', () => {
  it('emits one line per block element from whitespace-free HTML', () => {
    const text = extractText(MINIFIED_CAREER_PAGE)
    const lines = text.split('\n')

    expect(lines).toContain('VP of Engineering')
    expect(lines).toContain('Chief Technology Officer')
    expect(lines).toContain('Director of Platform Operations')
    // Titles must not fuse together
    expect(text).not.toMatch(/VP of EngineeringChief Technology Officer/)
  })

  it('produces identical line structure for minified and pretty-printed markup', () => {
    const pretty = MINIFIED_CAREER_PAGE
      .replace(/></g, '>\n<')
    expect(extractText(MINIFIED_CAREER_PAGE)).toBe(extractText(pretty))
  })

  it('treats <br> as a line break', () => {
    const text = extractText('<body><p>VP of Engineering<br>Chief Data Officer</p></body>')
    expect(text.split('\n')).toEqual(['VP of Engineering', 'Chief Data Officer'])
  })

  it('still strips scripts, styles and noise elements', () => {
    const text = extractText(
      '<body><script>var x="Head of Nothing";</script>' +
      '<div class="cookie-banner">Accept cookies</div>' +
      '<div>VP of Data</div></body>'
    )
    expect(text).toBe('VP of Data')
  })
})

describe('minified DOM fixture end to end (extractText + detectRoles)', () => {
  it('detects known role titles from a whitespace-free rendered DOM', () => {
    const text = extractText(MINIFIED_CAREER_PAGE)
    const candidates = detectRoles(text, { target_titles: [] })
    const titles = candidates.map(c => c.title)

    expect(titles).toContain('VP of Engineering')
    expect(titles).toContain('Chief Technology Officer')
    expect(titles).toContain('Director of Platform Operations')
  })
})

describe('normalizeText', () => {
  it('trims lines, collapses inner whitespace and drops empties', () => {
    expect(normalizeText('  VP of Data \n\n\n  Chief  of Staff\t\n')).toBe('VP of Data\nChief of Staff')
  })

  it('tolerates null and undefined', () => {
    expect(normalizeText(null)).toBe('')
    expect(normalizeText(undefined)).toBe('')
  })
})

describe('textShape', () => {
  it('reports chars, line count and max line length', () => {
    expect(textShape('abcd\nab\nabcdef')).toEqual({ chars: 14, lineCount: 3, maxLineChars: 6 })
  })

  it('reports zeros for empty input', () => {
    expect(textShape('')).toEqual({ chars: 0, lineCount: 0, maxLineChars: 0 })
  })
})

describe('isDegenerateTextShape', () => {
  it('flags a single giant line (the verified failure mode)', () => {
    const shape = textShape('x'.repeat(5000))
    expect(isDegenerateTextShape(shape)).toBe(true)
  })

  it('flags text dominated by one line even with a few stray short lines', () => {
    const shape = textShape(`Menu\n${'x'.repeat(4000)}\nContact`)
    expect(isDegenerateTextShape(shape)).toBe(true)
  })

  it('does not flag short pages, so sparse-but-honest pages stay success', () => {
    const shape = textShape('x'.repeat(DEGENERATE_MIN_CHARS - 1))
    expect(isDegenerateTextShape(shape)).toBe(false)
  })

  it('does not flag healthy line-structured text', () => {
    const healthy = Array.from({ length: 40 }, (_, i) => `Role title number ${i} with detail`).join('\n')
    expect(isDegenerateTextShape(textShape(healthy))).toBe(false)
  })

  it('extractText output on the minified fixture is not degenerate', () => {
    expect(isDegenerateTextShape(textShape(extractText(MINIFIED_CAREER_PAGE)))).toBe(false)
  })
})
