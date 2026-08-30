import { readFile, stat } from 'fs/promises'
import path from 'path'
import bundledFeatureDocs from '@/data/features-docs.bundle.json'

export type FeatureDocCategory = 'features' | 'onboarding' | 'analysis'

export type FeatureDocMeta = {
  slug: string
  title: string
  persona: 'executives' | 'coaches' | 'outplacement' | 'search-firms' | 'white-label' | 'cross-persona'
  category: FeatureDocCategory
  filePath: string
  landingHref?: string
}

export type FeatureDocCard = FeatureDocMeta & {
  summary: string
  lineCount: number
  headingCount: number
  updatedAt?: string
  lastLine: string
}

export type FeatureDocRecord = FeatureDocCard & {
  content: string
}

type BundledFeatureDocEntry = {
  slug: string
  title?: string
  summary?: string
  persona?: FeatureDocMeta['persona']
  category?: FeatureDocCategory
  filePath?: string
  landingHref?: string
  content?: string
  lineCount?: number
  headingCount?: number
  lastLine?: string
  updatedAt?: string | null
}

type BundledFeatureDocsFile = {
  generatedAt?: string
  entries?: BundledFeatureDocEntry[]
}

export const FEATURE_DOCS: FeatureDocMeta[] = [
  {
    slug: 'executives',
    title: 'Feature Guide: Executives',
    persona: 'executives',
    category: 'features',
    filePath: 'docs/features/features-executives.md',
    landingHref: '/for-executives',
  },
  {
    slug: 'executive-coaches',
    title: 'Feature Guide: Executive Coaches',
    persona: 'coaches',
    category: 'features',
    filePath: 'docs/features/features-executive-coaches.md',
    landingHref: '/for-coaches',
  },
  {
    slug: 'outplacement',
    title: 'Feature Guide: Outplacement',
    persona: 'outplacement',
    category: 'features',
    filePath: 'docs/features/features-outplacement.md',
    landingHref: '/for-outplacement',
  },
  {
    slug: 'search-firms',
    title: 'Feature Guide: Search Firms',
    persona: 'search-firms',
    category: 'features',
    filePath: 'docs/features/features-search-firms.md',
    landingHref: '/search-firms',
  },
  {
    slug: 'white-label',
    title: 'Feature Guide: White Label',
    persona: 'white-label',
    category: 'features',
    filePath: 'docs/features/features-white-label.md',
    landingHref: '/partners',
  },
  {
    slug: 'quick-start-executives',
    title: 'Quick Start: Executives',
    persona: 'executives',
    category: 'onboarding',
    filePath: 'docs/onboarding/quick-start-executives.md',
    landingHref: '/for-executives',
  },
  {
    slug: 'quick-start-executive-coaches',
    title: 'Quick Start: Executive Coaches',
    persona: 'coaches',
    category: 'onboarding',
    filePath: 'docs/onboarding/quick-start-executive-coaches.md',
    landingHref: '/for-coaches',
  },
  {
    slug: 'quick-start-outplacement',
    title: 'Quick Start: Outplacement',
    persona: 'outplacement',
    category: 'onboarding',
    filePath: 'docs/onboarding/quick-start-outplacement.md',
    landingHref: '/for-outplacement',
  },
  {
    slug: 'quick-start-search-firms',
    title: 'Quick Start: Search Firms',
    persona: 'search-firms',
    category: 'onboarding',
    filePath: 'docs/onboarding/quick-start-search-firms.md',
    landingHref: '/search-firms',
  },
  {
    slug: 'quick-start-white-label',
    title: 'Quick Start: White Label',
    persona: 'white-label',
    category: 'onboarding',
    filePath: 'docs/onboarding/quick-start-white-label.md',
    landingHref: '/partners',
  },
  {
    slug: 'onboarding-analysis',
    title: 'Onboarding and Time-to-Value Analysis',
    persona: 'cross-persona',
    category: 'analysis',
    filePath: 'docs/onboarding/onboarding-analysis.md',
    landingHref: '/features',
  },
]

function absolutePath(relativePath: string): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), relativePath)
}

function bundledEntryForSlug(slug: string): BundledFeatureDocEntry | null {
  const file = bundledFeatureDocs as BundledFeatureDocsFile
  const entries = file.entries ?? []
  return entries.find((entry) => entry.slug === slug) ?? null
}

function firstUsefulLine(content: string): string {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .filter((line) => !line.startsWith('---'))

  return lines[0] ?? 'No summary available yet.'
}

function clip(value: string, max = 190): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= max) return compact
  return `${compact.slice(0, max - 3)}...`
}

function titleFromContent(content: string, fallback: string): string {
  const firstHeading = content
    .split(/\r?\n/)
    .find((line) => line.startsWith('# '))
    ?.replace(/^#\s+/, '')
    .trim()

  return firstHeading || fallback
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 2)
}

export async function listFeatureDocCards(): Promise<FeatureDocCard[]> {
  const cards: FeatureDocCard[] = []
  const file = bundledFeatureDocs as BundledFeatureDocsFile
  const bundledEntries = file.entries ?? []

  for (const meta of FEATURE_DOCS) {
    const fullPath = absolutePath(meta.filePath)
    const bundled = bundledEntryForSlug(meta.slug)
    let content = await readFile(fullPath, 'utf8').catch(() => '')
    if (!content) content = bundled?.content ?? ''
    if (!content) continue

    const lines = content.split(/\r?\n/)
    const headingCount = lines.filter((line) => line.startsWith('## ') || line.startsWith('### ')).length
    const fileStat = await stat(fullPath).catch(() => null)
    const lastLine = lines.filter((line) => line.trim().length > 0).at(-1) ?? ''

    cards.push({
      ...meta,
      title: titleFromContent(content, meta.title),
      summary: clip(firstUsefulLine(content)),
      lineCount: lines.length,
      headingCount,
      updatedAt: fileStat?.mtime?.toISOString() ?? bundled?.updatedAt ?? undefined,
      lastLine: clip(lastLine, 140),
    })
  }

  if (cards.length === 0 && bundledEntries.length > 0) {
    for (const entry of bundledEntries) {
      if (!entry.slug || !entry.content) continue
      const meta = FEATURE_DOCS.find((doc) => doc.slug === entry.slug)
      const lines = entry.content.split(/\r?\n/)
      const headingCount = lines.filter((line) => line.startsWith('## ') || line.startsWith('### ')).length
      const lastLine = lines.filter((line) => line.trim().length > 0).at(-1) ?? ''

      cards.push({
        slug: entry.slug,
        title: titleFromContent(entry.content, entry.title ?? meta?.title ?? entry.slug),
        summary: clip(entry.summary ?? firstUsefulLine(entry.content)),
        persona: entry.persona ?? meta?.persona ?? 'cross-persona',
        category: entry.category ?? meta?.category ?? 'analysis',
        filePath: entry.filePath ?? meta?.filePath ?? '',
        landingHref: entry.landingHref ?? meta?.landingHref,
        lineCount: entry.lineCount ?? lines.length,
        headingCount: entry.headingCount ?? headingCount,
        updatedAt: entry.updatedAt ?? undefined,
        lastLine: clip(entry.lastLine ?? lastLine, 140),
      })
    }
  }

  return cards
}

export async function loadFeatureDocBySlug(slug: string): Promise<FeatureDocRecord | null> {
  const meta = FEATURE_DOCS.find((entry) => entry.slug === slug)
  if (!meta) return null

  const fullPath = absolutePath(meta.filePath)
  const bundled = bundledEntryForSlug(meta.slug)
  let content = await readFile(fullPath, 'utf8').catch(() => '')
  if (!content) content = bundled?.content ?? ''
  if (!content) return null

  const lines = content.split(/\r?\n/)
  const headingCount = lines.filter((line) => line.startsWith('## ') || line.startsWith('### ')).length
  const fileStat = await stat(fullPath).catch(() => null)
  const lastLine = lines.filter((line) => line.trim().length > 0).at(-1) ?? ''

  return {
    ...meta,
    title: titleFromContent(content, meta.title),
    summary: clip(firstUsefulLine(content)),
    lineCount: lines.length,
    headingCount,
    updatedAt: fileStat?.mtime?.toISOString() ?? bundled?.updatedAt ?? undefined,
    lastLine: clip(lastLine, 140),
    content,
  }
}

export async function loadAllFeatureDocs(): Promise<FeatureDocRecord[]> {
  const docs = await Promise.all(FEATURE_DOCS.map((entry) => loadFeatureDocBySlug(entry.slug)))
  return docs.filter((entry): entry is FeatureDocRecord => Boolean(entry))
}

export type FeatureDocSearchResult = {
  slug: string
  title: string
  summary: string
  url: string
  score: number
  snippet: string
  category: FeatureDocCategory
  persona: FeatureDocMeta['persona']
}

function snippetAround(content: string, queryTokens: string[]): string {
  const lower = content.toLowerCase()
  const matchToken = queryTokens.find((token) => lower.includes(token))
  if (!matchToken) return clip(firstUsefulLine(content), 170)

  const index = lower.indexOf(matchToken)
  const start = Math.max(0, index - 70)
  const end = Math.min(content.length, index + 130)
  return clip(content.slice(start, end).replace(/\r?\n/g, ' '), 170)
}

export function searchFeatureDocs(docs: FeatureDocRecord[], question: string): FeatureDocSearchResult[] {
  const tokens = tokenize(question)
  if (tokens.length === 0) return []

  const scored = docs.map((doc) => {
    const titleTokens = tokenize(doc.title)
    const summaryTokens = tokenize(doc.summary)
    const contentTokens = tokenize(doc.content)

    const overlap = (set: string[]) => tokens.reduce((sum, token) => sum + (set.includes(token) ? 1 : 0), 0)

    const titleScore = overlap(titleTokens) * 5
    const summaryScore = overlap(summaryTokens) * 3
    const contentScore = overlap(contentTokens) * 1
    const score = titleScore + summaryScore + contentScore

    return {
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      url: `/features/${doc.slug}`,
      score,
      snippet: snippetAround(doc.content, tokens),
      category: doc.category,
      persona: doc.persona,
    }
  })

  return scored.filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score)
}