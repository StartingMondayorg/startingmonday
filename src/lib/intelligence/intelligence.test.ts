import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  rankSignals: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/intelligence/intelligence-quality', () => ({ rankSignals: state.rankSignals }))

import {
  SIGNAL_COLORS,
  SIGNAL_FALLBACK_COLOR,
  createAccessToken,
  getIntelCompany,
  getIntelSignals,
  signalLabel,
  slugify,
  upsertIntelCompany,
  validateAccessToken,
} from '@/lib/intelligence/intelligence'

// A thenable query builder: every PostgREST method returns the builder, and
// awaiting it anywhere in the chain resolves the configured result.
function builder(result: unknown) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'ilike', 'order', 'limit', 'insert', 'upsert', 'single']) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej)
  return chain
}

function client(result: unknown) {
  const from = vi.fn(() => builder(result))
  return { from }
}

const signalRow = (over: Record<string, unknown> = {}) => ({
  id: 'sig-1',
  signal_type: 'funding',
  signal_summary: 'Raised a Series C',
  signal_date: '2026-05-01',
  source_url: 'https://example.com/a',
  source_kind: 'news',
  confidence: 0.8,
  focus_tags: ['growth'],
  ...over,
})

beforeEach(() => {
  vi.resetAllMocks()
  state.rankSignals.mockImplementation((signals: { confidence: number }[]) =>
    signals.map(s => ({ signal: s, confidence: s.confidence })))
})

describe('slugify', () => {
  it('lowercases and joins words with single hyphens', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp')
  })

  it('collapses runs of punctuation into one hyphen', () => {
    expect(slugify('Smith & Wesson, Inc.')).toBe('smith-wesson-inc')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  ...Datadog!  ')).toBe('datadog')
  })

  it('keeps digits', () => {
    expect(slugify('7-Eleven 2026')).toBe('7-eleven-2026')
  })

  it('returns an empty string when nothing survives', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('signalLabel', () => {
  it('maps a known signal type to its display label', () => {
    expect(signalLabel('exec_departure')).toBe('Exec Departure')
  })

  it('falls back to the raw type when unmapped', () => {
    expect(signalLabel('sudden_meteor_strike')).toBe('sudden_meteor_strike')
  })
})

describe('getIntelCompany', () => {
  it('returns the company row for a slug', async () => {
    const company = { slug: 'acme', company_name: 'Acme', description: null, sector: null, website: null }
    state.createClient.mockResolvedValue(client({ data: company }))
    await expect(getIntelCompany('acme')).resolves.toEqual(company)
  })

  it('returns null when no row matches', async () => {
    state.createClient.mockResolvedValue(client({ data: null }))
    await expect(getIntelCompany('nope')).resolves.toBeNull()
  })
})

describe('getIntelSignals', () => {
  it('returns an empty list when the query yields no data', async () => {
    state.createAdminClient.mockReturnValue(client({ data: null }))
    await expect(getIntelSignals('Acme')).resolves.toEqual([])
  })

  it('deduplicates rows sharing a source_url', async () => {
    state.createAdminClient.mockReturnValue(client({
      data: [signalRow(), signalRow({ id: 'sig-2' }), signalRow({ id: 'sig-3', source_url: 'https://example.com/b' })],
    }))
    const signals = await getIntelSignals('Acme')
    expect(signals.map(s => s.id)).toEqual(['sig-1', 'sig-3'])
  })

  it('falls back to type and summary when source_url is missing', async () => {
    state.createAdminClient.mockReturnValue(client({
      data: [
        signalRow({ id: 'a', source_url: null }),
        signalRow({ id: 'b', source_url: null }),
        signalRow({ id: 'c', source_url: null, signal_summary: 'Different event entirely' }),
      ],
    }))
    const signals = await getIntelSignals('Acme')
    expect(signals.map(s => s.id)).toEqual(['a', 'c'])
  })

  it('caps the deduplicated set at twenty signals', async () => {
    state.createAdminClient.mockReturnValue(client({
      data: Array.from({ length: 30 }, (_, i) => signalRow({ id: `s-${i}`, source_url: `https://example.com/${i}` })),
    }))
    await expect(getIntelSignals('Acme')).resolves.toHaveLength(20)
  })

  it('takes the confidence assigned by ranking', async () => {
    state.createAdminClient.mockReturnValue(client({ data: [signalRow({ confidence: 0.2 })] }))
    state.rankSignals.mockReturnValue([{ signal: signalRow({ confidence: 0.2 }), confidence: 0.95 }])
    const [signal] = await getIntelSignals('Acme')
    expect(signal.confidence).toBe(0.95)
  })
})

describe('validateAccessToken', () => {
  it('rejects a missing token without hitting the database', async () => {
    await expect(validateAccessToken('acme', null)).resolves.toBe(false)
    expect(state.createClient).not.toHaveBeenCalled()
  })

  it('rejects a token with no matching row', async () => {
    state.createClient.mockResolvedValue(client({ data: null }))
    await expect(validateAccessToken('acme', 'tok')).resolves.toBe(false)
  })

  it('accepts a token with no expiry', async () => {
    state.createClient.mockResolvedValue(client({ data: { id: 'tok', expires_at: null } }))
    await expect(validateAccessToken('acme', 'tok')).resolves.toBe(true)
  })

  it('accepts a token that has not expired yet', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    state.createClient.mockResolvedValue(client({ data: { id: 'tok', expires_at: future } }))
    await expect(validateAccessToken('acme', 'tok')).resolves.toBe(true)
  })

  it('rejects an expired token', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    state.createClient.mockResolvedValue(client({ data: { id: 'tok', expires_at: past } }))
    await expect(validateAccessToken('acme', 'tok')).resolves.toBe(false)
  })
})

describe('createAccessToken', () => {
  it('returns the new token id', async () => {
    state.createAdminClient.mockReturnValue(client({ data: { id: 'tok-1' }, error: null }))
    await expect(createAccessToken('acme', 'user-1', 'Board share')).resolves.toBe('tok-1')
  })

  it('supports a non-expiring token', async () => {
    state.createAdminClient.mockReturnValue(client({ data: { id: 'tok-2' }, error: null }))
    await expect(createAccessToken('acme', 'user-1', 'Forever', null)).resolves.toBe('tok-2')
  })

  it('throws the database error message when insertion fails', async () => {
    state.createAdminClient.mockReturnValue(client({ data: null, error: { message: 'duplicate key' } }))
    await expect(createAccessToken('acme', 'user-1', 'Dupe')).rejects.toThrow('duplicate key')
  })

  it('throws a generic error when no row comes back', async () => {
    state.createAdminClient.mockReturnValue(client({ data: null, error: null }))
    await expect(createAccessToken('acme', 'user-1', 'Empty')).rejects.toThrow('Failed to create token')
  })
})

describe('upsertIntelCompany', () => {
  it('returns the slug derived from the company name', async () => {
    state.createAdminClient.mockReturnValue(client({ error: null }))
    await expect(upsertIntelCompany('user-1', { company_name: 'Acme Corp' })).resolves.toBe('acme-corp')
  })

  it('throws the database error message when the upsert fails', async () => {
    state.createAdminClient.mockReturnValue(client({ error: { message: 'permission denied' } }))
    await expect(upsertIntelCompany('user-1', { company_name: 'Acme' })).rejects.toThrow('permission denied')
  })
})

describe('SIGNAL_COLORS', () => {
  it('uses only semantic tokens, never a raw palette hue', () => {
    const hues = /\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/
    for (const [type, className] of Object.entries(SIGNAL_COLORS)) {
      expect(className, type).not.toMatch(hues)
      expect(className, type).toMatch(/^bg-[a-z-]+(?:\/\d+)? text-[a-z-]+$/)
    }
    expect(SIGNAL_FALLBACK_COLOR).not.toMatch(hues)
  })

  it('pairs every background with a foreground of the same token family', () => {
    for (const [type, className] of Object.entries(SIGNAL_COLORS)) {
      const bg = /bg-([a-z-]+?)(?:\/\d+)?\s/.exec(`${className} `)?.[1]
      const text = /text-([a-z-]+)/.exec(className)?.[1]
      expect(bg, type).toBeTruthy()
      expect(text, type).toBeTruthy()
      // muted surfaces carry muted-foreground; every other tint reuses its own token
      expect(text, type).toBe(bg === 'muted' ? 'muted-foreground' : bg)
    }
  })

  it('labels every signal type it colours', () => {
    for (const type of Object.keys(SIGNAL_COLORS)) {
      expect(signalLabel(type), type).not.toBe(type)
    }
  })
})
