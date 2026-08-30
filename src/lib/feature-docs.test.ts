import { describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  FEATURE_DOCS,
  listFeatureDocCards,
  loadAllFeatureDocs,
  loadFeatureDocBySlug,
  searchFeatureDocs,
} from './feature-docs'

describe('feature docs', () => {
  it('loads card metadata and full records for every configured document', async () => {
    const cards = await listFeatureDocCards()
    const docs = await loadAllFeatureDocs()

    expect(cards).toHaveLength(FEATURE_DOCS.length)
    expect(docs).toHaveLength(FEATURE_DOCS.length)
    expect(cards.every((card) => card.lineCount > 0 && card.headingCount > 0)).toBe(true)
    expect(docs.every((doc) => doc.content.length > 0 && doc.summary.length > 0)).toBe(true)
  })

  it('loads a known slug and rejects an unknown slug', async () => {
    await expect(loadFeatureDocBySlug('executives')).resolves.toMatchObject({
      slug: 'executives',
      persona: 'executives',
      category: 'features',
    })
    await expect(loadFeatureDocBySlug('not-a-feature')).resolves.toBeNull()
  })

  it('loads bundled documents when source files are unavailable', async () => {
    const originalCwd = process.cwd()
    const emptyCwd = await mkdtemp(path.join(tmpdir(), 'feature-docs-'))

    try {
      process.chdir(emptyCwd)

      const cards = await listFeatureDocCards()
      const record = await loadFeatureDocBySlug('executives')

      expect(cards).toHaveLength(FEATURE_DOCS.length)
      expect(record?.content.length).toBeGreaterThan(0)
      expect(record?.title).toBe('Feature Guide: Executives')
    } finally {
      process.chdir(originalCwd)
      await rm(emptyCwd, { recursive: true, force: true })
    }
  })

  it('ranks matching documents and handles empty or unmatched searches', async () => {
    const docs = await loadAllFeatureDocs()
    const results = searchFeatureDocs(docs, 'executive onboarding')

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((result) => result.score > 0 && result.url.startsWith('/features/'))).toBe(true)
    expect(results.map((result) => result.score)).toEqual(
      [...results].map((result) => result.score).sort((left, right) => right - left),
    )
    expect(searchFeatureDocs(docs, '')).toEqual([])
    expect(searchFeatureDocs(docs, 'zzzzunmatchedtoken')).toEqual([])
  })

  it('reconstructs cards from standalone bundled entries', async () => {
    vi.resetModules()
    vi.doMock('fs/promises', () => ({
      readFile: vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' })),
      stat: vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' })),
    }))
    vi.doMock('@/data/features-docs.bundle.json', () => ({
      default: {
        entries: [
          { slug: '', content: 'ignored' },
          { slug: 'missing-content' },
          { slug: 'standalone', content: '# Standalone\n\nBundled summary.' },
        ],
      },
    }))

    const isolatedModule = await import('./feature-docs')

    await expect(isolatedModule.listFeatureDocCards()).resolves.toEqual([
      expect.objectContaining({
        slug: 'standalone',
        title: 'Standalone',
        summary: 'Bundled summary.',
        persona: 'cross-persona',
        category: 'analysis',
        filePath: '',
      }),
    ])

    vi.doUnmock('fs/promises')
    vi.doUnmock('@/data/features-docs.bundle.json')
    vi.resetModules()
  })
})
