import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { readGuideRuntimeFile } from '@/app/guide-runtime-files'
import { GuideClient } from './guide-client'

type GuideSection = {
  id: string
  title: string
  body: string
  items?: Array<{
    title: string
    url?: string
    summary: string
    lastModifiedAt?: string
    qualityWeight?: number
  }>
}

type UserGuideIndexEntry = {
  id: string
  title: string
  body: string
  type: 'get-started' | 'feature' | 'how-to' | 'api' | 'article'
  url: string
  lastModifiedAt?: string
  qualityWeight?: number
}

type UserGuideIndexFile = {
  generatedAt?: string
  entries?: UserGuideIndexEntry[]
}

const CORE_USER_SECTIONS: GuideSection[] = [
  {
    id: 'core-start-here',
    title: 'Get Started (Core)',
    body: [
      '- Open your dashboard and complete your profile before adding outreach targets.',
      '- Add companies and contacts, then use guide chat for feature-specific workflows.',
      '- Use help and guide pages for troubleshooting and escalation paths.',
    ].join('\n'),
  },
  {
    id: 'core-features',
    title: 'Features (Core)',
    body: [
      '- Dashboard and pipeline flows for company and contact tracking.',
      '- Guide chat and article links for self-serve operations.',
      '- Automation and API endpoints for advanced usage and integrations.',
    ].join('\n'),
  },
  {
    id: 'core-support',
    title: 'Troubleshooting and Support (Core)',
    body: [
      '- If a workflow fails, retry once and check status indicators on the active page.',
      '- Use guide search with terms like setup, profile, contacts, outreach, automation, or billing.',
      '- If still blocked, use the help route from the dashboard for next-step support.',
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
        sections.push({
          id: `section-${index}`,
          title: currentTitle,
          body: currentBody.join('\n'),
        })
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

function typeLabel(type: UserGuideIndexEntry['type']): string {
  if (type === 'get-started') return 'Get Started'
  if (type === 'feature') return 'Features'
  if (type === 'how-to') return 'How-To Playbooks'
  if (type === 'api') return 'API and Automation'
  return 'Starting Monday Articles'
}

function sectionsFromIndex(entries: UserGuideIndexEntry[]): GuideSection[] {
  const order: UserGuideIndexEntry['type'][] = ['get-started', 'feature', 'how-to', 'api', 'article']
  const grouped = new Map<UserGuideIndexEntry['type'], UserGuideIndexEntry[]>()

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
    const body = list
      .slice(0, 120)
      .map((entry) => `- [${entry.title}](${entry.url}) - ${entry.body}`)
      .join('\n')

    sections.push({
      id: `section-${index}`,
      title: `${typeLabel(type)} (${list.length})`,
      body,
      items: list.slice(0, 120).map((entry) => ({
        title: entry.title,
        url: entry.url,
        summary: entry.body,
        lastModifiedAt: entry.lastModifiedAt,
        qualityWeight: entry.qualityWeight,
      })),
    })
    index += 1
  }

  return sections
}

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const diskIndexRaw = await readGuideRuntimeFile('user-guide.index.json')
  let diskIndexEntries: UserGuideIndexEntry[] = []
  let guideGeneratedAt = ''
  if (diskIndexRaw) {
    try {
      const parsed = JSON.parse(diskIndexRaw) as UserGuideIndexFile
      diskIndexEntries = parsed.entries ?? []
      guideGeneratedAt = parsed.generatedAt ?? ''
    } catch {
      diskIndexEntries = []
    }
  }

  const indexSections = sectionsFromIndex(diskIndexEntries)

  const markdown = await readGuideRuntimeFile('user-guide.md')
  const markdownSections = parseGuide(markdown)
  const sections = indexSections.length > 0 ? indexSections : markdownSections

  const safeSections = sections.length > 0 ? sections : CORE_USER_SECTIONS

  return (
    <>
        <p className="sr-only">Privacy-first by design.</p>
      <section className="sr-only" aria-label="Automation guide summary">
        <h1>Starting Monday user guide</h1>
        <p>Search for features, ask questions in guide chat, and open step-by-step workflows in one place.</p>
        <p>Outcome: users can self-serve onboarding, feature discovery, and troubleshooting without waiting for support.</p>
        <Link href="/dashboard/help">Get started from Help</Link>
      </section>
      <GuideClient sections={safeSections} initialQuestion={q?.slice(0, 500) ?? ''} guideGeneratedAt={guideGeneratedAt} />
    </>
  )
}
