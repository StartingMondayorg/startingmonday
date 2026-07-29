import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { readGuideRuntimeFile } from '@/lib/guide-runtime-files'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { InternalGuideClient } from './internal-guide-client'

type GuideSection = {
  id: string
  title: string
  body: string
  items?: Array<{
    title: string
    ref?: string
    summary: string
    lastModifiedAt?: string
    qualityWeight?: number
  }>
}

type InternalIndexEntry = {
  id: string
  title: string
  body: string
  type: 'architecture' | 'feature' | 'api' | 'code' | 'infra' | 'doc' | 'script' | 'data'
  ref: string
  lastModifiedAt?: string
  qualityWeight?: number
}

type InternalIndexFile = {
  generatedAt?: string
  entries?: InternalIndexEntry[]
}

const CORE_INTERNAL_SECTIONS: GuideSection[] = [
  {
    id: 'core-architecture',
    title: 'Architecture (Core)',
    body: [
      '- Platform architecture overview | docs/internal-system-summary.md | System map for app routes, APIs, data, and workflows.',
      '- Internal guide index | docs/internal-guide.index.json | Generated source index used for search and chat retrieval.',
      '- Internal guide markdown | docs/internal-guide.md | Human-readable grouped sections generated from source artifacts.',
    ].join('\n'),
  },
  {
    id: 'core-api',
    title: 'API Surface (Core)',
    body: [
      '- Internal guide chat | src/app/api/admin/internal-guide/chat/route.ts | Internal retrieval and source-linked answers.',
      '- External guide chat | src/app/api/guide/chat/route.ts | Customer-facing guide retrieval and response endpoint.',
      '- Auth start fallback | src/app/api/auth/oauth-start/route.ts | Server fallback for OAuth flow start.',
    ].join('\n'),
  },
  {
    id: 'core-operations',
    title: 'Operations and Reliability (Core)',
    body: [
      '- Internal guide sync | scripts/internal-guide-sync.ts | Regenerates internal guide artifacts.',
      '- User guide sync | scripts/user-guide-sync.ts | Regenerates external guide artifacts.',
      '- Production synthetics | .github/workflows/production-synthetics.yml | 5-minute monitoring and alerting workflow.',
    ].join('\n'),
  },
]

function parseGuide(markdown: string): GuideSection[] {
  const lines = markdown.split(/\r?\n/)
  const sections: GuideSection[] = []

  let currentTitle = ''
  let currentBody: string[] = []
  let index = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ id: `section-${index}`, title: currentTitle, body: currentBody.join('\n') })
        index += 1
      }
      currentTitle = line.replace(/^##\s+/, '').trim()
      currentBody = []
      continue
    }

    if (currentTitle) currentBody.push(line)
  }

  if (currentTitle) {
    sections.push({ id: `section-${index}`, title: currentTitle, body: currentBody.join('\n') })
  }

  return sections
}

function typeLabel(type: InternalIndexEntry['type']): string {
  if (type === 'architecture') return 'Architecture'
  if (type === 'feature') return 'Features'
  if (type === 'api') return 'API Surface'
  if (type === 'code') return 'Codebase Modules'
  if (type === 'script') return 'Internal Scripts'
  if (type === 'infra') return 'Infrastructure and Workflows'
  if (type === 'data') return 'Data and Migrations'
  return 'Documentation'
}

function sectionsFromIndex(entries: InternalIndexEntry[]): GuideSection[] {
  const order: InternalIndexEntry['type'][] = ['architecture', 'feature', 'api', 'code', 'script', 'infra', 'data', 'doc']
  const grouped = new Map<InternalIndexEntry['type'], InternalIndexEntry[]>()

  for (const entry of entries) {
    const list = grouped.get(entry.type) ?? []
    list.push(entry)
    grouped.set(entry.type, list)
  }

  const sections: GuideSection[] = []
  let index = 0
  for (const type of order) {
    const list = grouped.get(type) ?? []
    if (list.length === 0) continue
    const preview = list.slice(0, 120)
    const body = preview
      .map((entry) => `- ${entry.title} | ${entry.ref} | ${entry.body}`)
      .join('\n')
    sections.push({
      id: `section-${index}`,
      title: `${typeLabel(type)} (${list.length})`,
      body,
      items: preview.map((entry) => ({
        title: entry.title,
        ref: entry.ref,
        summary: entry.body,
        lastModifiedAt: entry.lastModifiedAt,
        qualityWeight: entry.qualityWeight,
      })),
    })
    index += 1
  }

  return sections
}

export default async function InternalGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!hasAdminHeaderAccess(staff)) notFound()
  const staffMember = staff!

  const diskIndexRaw = await readGuideRuntimeFile('internal-guide.index.json')
  let diskIndexEntries: InternalIndexEntry[] = []
  let guideGeneratedAt = ''
  if (diskIndexRaw) {
    try {
      const parsed = JSON.parse(diskIndexRaw) as InternalIndexFile
      diskIndexEntries = parsed.entries ?? []
      guideGeneratedAt = parsed.generatedAt ?? ''
    } catch {
      diskIndexEntries = []
    }
  }

  const indexSections = sectionsFromIndex(diskIndexEntries)

  const markdown = await readGuideRuntimeFile('internal-guide.md')
  const markdownSections = parseGuide(markdown)
  const sections = indexSections.length > 0 ? indexSections : markdownSections

  const safeSections = sections.length > 0 ? sections : CORE_INTERNAL_SECTIONS

  return (
    <>
      <h1 className="sr-only">Internal Guide</h1>
      <InternalGuideClient
        sections={safeSections}
        initialQuestion={q?.slice(0, 500) ?? ''}
        staffRole={staffMember.role}
        guideGeneratedAt={guideGeneratedAt}
      />
    </>
  )
}
