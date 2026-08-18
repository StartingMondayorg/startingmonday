import { createHash } from 'crypto'
import { execFile } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { promisify } from 'util'
import { BLOG_POSTS } from '../src/lib/blog-posts'

type GuideEntry = {
  id: string
  title: string
  body: string
  type: 'get-started' | 'feature' | 'how-to' | 'api' | 'article'
  url: string
  tags: string[]
  qualityWeight: number
  lastModifiedAt?: string
}

type GuideManifest = {
  generatedAt: string
  sourceHash: string
  sourceFileCount: number
  entryCount: number
  changedEntryCount: number
}

const ROOT = process.cwd()
const DOCS_DIR = path.join(ROOT, 'docs')
const GUIDE_MD_PATH = path.join(DOCS_DIR, 'user-guide.md')
const GUIDE_INDEX_PATH = path.join(DOCS_DIR, 'user-guide.index.json')
const GUIDE_MANIFEST_PATH = path.join(DOCS_DIR, 'user-guide.manifest.json')
const AUTOMATION_GUIDE_PATH = path.join(DOCS_DIR, 'automation-guide.md')

const CHECK_ONLY = process.argv.includes('--check')
const FORCE = process.argv.includes('--force')
const execFileAsync = promisify(execFile)
let trackedFilesPromise: Promise<Set<string>> | null = null

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = []
  const stack = [dir]

  while (stack.length > 0) {
    const current = stack.pop()!
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => [])
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile()) {
        out.push(fullPath)
      }
    }
  }

  return out
}

async function lastModifiedAt(filePath: string): Promise<string | undefined> {
  const stat = await fs.stat(filePath).catch(() => null)
  return stat?.mtime?.toISOString()
}

function rel(filePath: string): string {
  return path.relative(ROOT, filePath).replace(/\\/g, '/')
}

async function getTrackedFiles(): Promise<Set<string>> {
  if (!trackedFilesPromise) {
    trackedFilesPromise = execFileAsync('git', ['ls-files'], { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 })
      .then(({ stdout }) => new Set(stdout.split('\n').map((line) => line.trim()).filter(Boolean)))
      .catch(() => new Set<string>())
  }

  return trackedFilesPromise
}

function routeLabel(route: string): string {
  const clean = route.replace(/^\//, '')
  if (!clean) return 'Dashboard Home'
  return clean
    .split('/')
    .map((part) => part.replace(/-/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ')
}

function pageFileToRoute(filePath: string): string | null {
  const relative = path.relative(path.join(ROOT, 'src', 'app'), filePath).replace(/\\/g, '/')
  if (!relative.endsWith('/page.tsx')) return null
  if (relative.includes('[')) return null

  const route = relative
    .replace(/\/page\.tsx$/, '')
    .split('/')
    .filter((segment) => !segment.startsWith('(') && !segment.endsWith(')'))
    .join('/')

  return `/${route}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

function apiFileToRoute(filePath: string): string | null {
  const relative = path.relative(path.join(ROOT, 'src', 'app', 'api'), filePath).replace(/\\/g, '/')
  if (!relative.endsWith('/route.ts')) return null
  return `/api/${relative.replace(/\/route\.ts$/, '')}`
}

function entryLine(entry: GuideEntry): string {
  return `- [${entry.title}](${entry.url}) - ${entry.body}`
}

function inferQualityWeight(entry: Omit<GuideEntry, 'qualityWeight'>): number {
  if (entry.type === 'get-started') return 1.35
  if (entry.type === 'how-to') return 1.3
  if (entry.url === '/guide') return 1.45
  if (entry.type === 'feature' && entry.url.startsWith('/dashboard')) return 1.2
  if (entry.type === 'api') return 0.95
  if (entry.type === 'article') return 0.9
  return 1
}

function withQualityWeight(entry: Omit<GuideEntry, 'qualityWeight'>): GuideEntry {
  return {
    ...entry,
    qualityWeight: inferQualityWeight(entry),
  }
}

function automationGuideHowToSections(markdown: string): GuideEntry[] {
  const lines = markdown.split(/\r?\n/)
  const sections: Array<{ title: string; body: string[] }> = []
  let current: { title: string; body: string[] } | null = null

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: line.replace(/^##\s+/, '').trim(), body: [] }
      continue
    }
    if (current) current.body.push(line)
  }
  if (current) sections.push(current)

  return sections
    .filter((section) => section.title.toLowerCase().includes('guide') || section.title.toLowerCase().includes('how'))
    .map((section, index) => withQualityWeight({
      id: `howto-${index + 1}`,
      title: section.title,
      body: section.body.join(' ').replace(/\s+/g, ' ').trim().slice(0, 220) || 'Operational walkthrough and steps.',
      type: 'how-to' as const,
      url: '/guide',
      tags: ['how-to', 'operations'],
    }))
}

async function buildGuidePayload() {
  const appDir = path.join(ROOT, 'src', 'app')
  const dashboardDir = path.join(ROOT, 'src', 'app', '(dashboard)', 'dashboard')
  const apiDir = path.join(ROOT, 'src', 'app', 'api')

  const appPageFiles = (await listFilesRecursive(appDir)).filter((file) => file.endsWith('/page.tsx') || file.endsWith('\\page.tsx'))
    .sort((left, right) => left.localeCompare(right))
  const dashboardFiles = (await listFilesRecursive(dashboardDir)).filter((file) => file.endsWith('/page.tsx') || file.endsWith('\\page.tsx'))
    .sort((left, right) => left.localeCompare(right))
  const apiFiles = (await listFilesRecursive(apiDir)).filter((file) => file.endsWith('/route.ts') || file.endsWith('\\route.ts'))
    .sort((left, right) => left.localeCompare(right))

  const appRoutes = appPageFiles
    .map((file) => pageFileToRoute(file))
    .filter((route): route is string => Boolean(route))
    .filter((route) => !route.startsWith('/blog/'))

  const dashboardRoutes = dashboardFiles
    .map((file) => pageFileToRoute(file))
    .filter((route): route is string => Boolean(route))
    .filter((route) => route.startsWith('/dashboard'))

  const routeToFile = new Map<string, string>()
  for (const file of appPageFiles) {
    const route = pageFileToRoute(file)
    if (route) routeToFile.set(route, file)
  }

  const featureEntries = [...new Set([...appRoutes, ...dashboardRoutes])]
    .map(async (route, index) => withQualityWeight({
      id: `feature-${index + 1}`,
      title: routeLabel(route),
      body: `Open ${route} to use this feature area and related workflows.`,
      type: 'feature',
      url: route,
      tags: ['feature', 'dashboard'],
      lastModifiedAt: await lastModifiedAt(routeToFile.get(route) ?? ''),
    }))

  const resolvedFeatureEntries = await Promise.all(featureEntries)

  const apiEntries: GuideEntry[] = await Promise.all(apiFiles
    .map((file) => ({ file, route: apiFileToRoute(file) }))
    .filter((entry): entry is { file: string; route: string } => Boolean(entry.route))
    .map(async ({ file, route }, index) => withQualityWeight({
      id: `api-${index + 1}`,
      title: route,
      body: 'Programmatic endpoint available for platform behavior or integrations.',
      type: 'api',
      url: route,
      tags: ['api', 'automation'],
      lastModifiedAt: await lastModifiedAt(file),
    })))

  const articleEntries: GuideEntry[] = await Promise.all(BLOG_POSTS.map(async (post, index) => withQualityWeight({
    id: `article-${index + 1}`,
    title: post.title,
    body: post.description,
    type: 'article',
    url: `/blog/${post.slug}`,
    tags: ['article', ...post.keywords.slice(0, 5)],
    lastModifiedAt: await lastModifiedAt(path.join(ROOT, 'src', 'app', '(marketing)', 'blog', post.slug, 'page.tsx')),
  })))

  const getStartedEntries: GuideEntry[] = await Promise.all([
    withQualityWeight({
      id: 'get-started-0',
      title: 'Use the user guide and guide chat',
      body: 'Open the guide hub to search all sections and ask guide chat for source-linked answers.',
      type: 'get-started',
      url: '/guide',
      tags: ['get-started', 'guide', 'help'],
      lastModifiedAt: await lastModifiedAt(routeToFile.get('/guide') ?? ''),
    }),
    withQualityWeight({
      id: 'get-started-1',
      title: 'Complete the setup checklist',
      body: 'Begin with the guided setup checklist to unlock core workflows quickly.',
      type: 'get-started',
      url: '/dashboard/start',
      tags: ['get-started', 'onboarding'],
      lastModifiedAt: await lastModifiedAt(routeToFile.get('/dashboard/start') ?? ''),
    }),
    withQualityWeight({
      id: 'get-started-2',
      title: 'Set your profile and resume',
      body: 'Upload resume and profile context to improve briefs, outreach, and recommendations.',
      type: 'get-started',
      url: '/dashboard/profile',
      tags: ['get-started', 'profile'],
      lastModifiedAt: await lastModifiedAt(routeToFile.get('/dashboard/profile') ?? ''),
    }),
    withQualityWeight({
      id: 'get-started-3',
      title: 'Add target companies and contacts',
      body: 'Build your pipeline so signals, prep briefs, and outreach workflows have context.',
      type: 'get-started',
      url: '/dashboard/companies/new',
      tags: ['get-started', 'pipeline'],
      lastModifiedAt: await lastModifiedAt(routeToFile.get('/dashboard/companies/new') ?? ''),
    }),
    withQualityWeight({
      id: 'get-started-4',
      title: 'Use Help and FAQ',
      body: 'Use the help page for onboarding steps, FAQ answers, and direct guide access.',
      type: 'get-started',
      url: '/dashboard/help',
      tags: ['get-started', 'help', 'faq'],
      lastModifiedAt: await lastModifiedAt(routeToFile.get('/dashboard/help') ?? ''),
    }),
  ])

  const automationGuide = (await fs.readFile(AUTOMATION_GUIDE_PATH, 'utf8').catch(() => ''))
  const howToEntries = automationGuideHowToSections(automationGuide).map((entry) => ({
    ...entry,
    lastModifiedAt: entry.lastModifiedAt ?? undefined,
  }))
  for (const entry of howToEntries) {
    entry.lastModifiedAt = await lastModifiedAt(AUTOMATION_GUIDE_PATH)
  }

  const entries: GuideEntry[] = [
    ...getStartedEntries,
    ...resolvedFeatureEntries,
    ...howToEntries,
    ...apiEntries,
    ...articleEntries,
  ]

  const nowIso = new Date().toISOString()

  const sections = {
    getStarted: entries.filter((entry) => entry.type === 'get-started'),
    features: entries.filter((entry) => entry.type === 'feature'),
    howTos: entries.filter((entry) => entry.type === 'how-to'),
    api: entries.filter((entry) => entry.type === 'api'),
    articles: entries.filter((entry) => entry.type === 'article'),
  }

  const markdown = [
    '# Starting Monday User Guide',
    '',
    `Last generated: ${nowIso}`,
    '',
    'This guide is generated from product routes, APIs, and published articles.',
    '',
    '## Get Started',
    ...sections.getStarted.map(entryLine),
    '',
    `## Features (${sections.features.length})`,
    ...sections.features.map(entryLine),
    '',
    '## How-To Playbooks',
    ...sections.howTos.map(entryLine),
    '',
    `## API and Automation (${sections.api.length})`,
    ...sections.api.map(entryLine),
    '',
    `## Starting Monday Articles (${sections.articles.length})`,
    ...sections.articles.map(entryLine),
    '',
  ].join('\n')

  return {
    generatedAt: nowIso,
    entries,
    markdown,
  }
}

async function collectWatchedFiles(): Promise<string[]> {
  const appDir = path.join(ROOT, 'src', 'app')
  const dashboardDir = path.join(ROOT, 'src', 'app', '(dashboard)', 'dashboard')
  const apiDir = path.join(ROOT, 'src', 'app', 'api')

  const [appFiles, dashboardFiles, apiFiles, trackedFiles] = await Promise.all([
    listFilesRecursive(appDir),
    listFilesRecursive(dashboardDir),
    listFilesRecursive(apiDir),
    getTrackedFiles(),
  ])

  return [
    ...appFiles.filter((file) => file.endsWith('.tsx') || file.endsWith('.ts')),
    ...dashboardFiles.filter((file) => file.endsWith('.tsx') || file.endsWith('.ts')),
    ...apiFiles.filter((file) => file.endsWith('.ts')),
    path.join(ROOT, 'src', 'lib', 'blog-posts.ts'),
    AUTOMATION_GUIDE_PATH,
  ].filter((file) => trackedFiles.has(rel(file)))
}

async function computeSourceHash(files: string[]): Promise<string> {
  const hash = createHash('sha256')
  const sorted = [...new Set(files)].sort((left, right) => {
    const leftKey = path.relative(ROOT, left).replace(/\\/g, '/')
    const rightKey = path.relative(ROOT, right).replace(/\\/g, '/')
    if (leftKey < rightKey) return -1
    if (leftKey > rightKey) return 1
    return 0
  })

  for (const filePath of sorted) {
    const exists = await fileExists(filePath)
    if (!exists) continue
    const contents = await fs.readFile(filePath, 'utf8')
    const normalizedContents = contents.replace(/\r\n/g, '\n')
    hash.update(path.relative(ROOT, filePath).replace(/\\/g, '/'))
    hash.update(normalizedContents)
  }

  return hash.digest('hex')
}

async function readManifest(): Promise<GuideManifest | null> {
  const exists = await fileExists(GUIDE_MANIFEST_PATH)
  if (!exists) return null

  const raw = await fs.readFile(GUIDE_MANIFEST_PATH, 'utf8').catch(() => '')
  if (!raw) return null

  try {
    return JSON.parse(raw) as GuideManifest
  } catch {
    return null
  }
}

async function writePayload(payload: { generatedAt: string; entries: GuideEntry[]; markdown: string }, sourceHash: string, sourceFileCount: number) {
  await fs.mkdir(DOCS_DIR, { recursive: true })

  const priorIndexRaw = await fs.readFile(GUIDE_INDEX_PATH, 'utf8').catch(() => '')
  const priorEntries = priorIndexRaw
    ? ((JSON.parse(priorIndexRaw) as { entries?: GuideEntry[] }).entries ?? [])
    : []
  const priorMap = new Map(priorEntries.map((entry) => [entry.id, JSON.stringify(entry)]))

  let changedEntryCount = 0
  for (const entry of payload.entries) {
    const previous = priorMap.get(entry.id)
    if (!previous || previous !== JSON.stringify(entry)) changedEntryCount += 1
  }

  await Promise.all([
    fs.writeFile(GUIDE_MD_PATH, payload.markdown, 'utf8'),
    fs.writeFile(
      GUIDE_INDEX_PATH,
      JSON.stringify({ generatedAt: payload.generatedAt, entries: payload.entries }, null, 2),
      'utf8',
    ),
    fs.writeFile(
      GUIDE_MANIFEST_PATH,
      JSON.stringify({ generatedAt: payload.generatedAt, sourceHash, sourceFileCount, entryCount: payload.entries.length, changedEntryCount }, null, 2),
      'utf8',
    ),
  ])
}

async function main() {
  const watchedFiles = await collectWatchedFiles()
  const sourceHash = await computeSourceHash(watchedFiles)
  const manifest = await readManifest()

  const needsUpdate = FORCE || !manifest || manifest.sourceHash !== sourceHash

  if (!needsUpdate) {
    console.log('user-guide: up to date')
    return
  }

  if (CHECK_ONLY) {
    console.error('user-guide: stale (run npm run guide:user:sync)')
    process.exitCode = 1
    return
  }

  const payload = await buildGuidePayload()
  await writePayload(payload, sourceHash, watchedFiles.length)
  console.log(`user-guide: regenerated with ${payload.entries.length} entries`)
}

main().catch((error) => {
  console.error('user-guide: failed', error)
  process.exitCode = 1
})
