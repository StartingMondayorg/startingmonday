import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNextSocialPostDays } from '@/lib/social-posting-plan'

type SocialPillar = 'search_craft' | 'market_intel' | 'behind_build' | 'user_story' | 'engagement'

type HandoffHistoryRun = {
  batchId: string
  createdAt: string
  articleTitle: string | null
  dates: string[]
}

type ApprovedHandoffBody = {
  approvalStatus?: string
  startDate?: string
  variantCount?: number
  pillar?: SocialPillar
  audience?: string
  article?: {
    title?: string
    url?: string
    summary?: string
    keyTakeaways?: string[]
    claim?: string
    cta?: string
  }
}

const ALLOWED_PILLARS = new Set<SocialPillar>([
  'search_craft',
  'market_intel',
  'behind_build',
  'user_story',
  'engagement',
])

function safeSummary(summary: string | undefined, fallback: string): string {
  const trimmed = (summary ?? '').trim()
  if (!trimmed) return fallback
  return trimmed.replace(/\s+/g, ' ')
}

function truncate(text: string, max = 900): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}...`
}

function buildVariants(body: ApprovedHandoffBody, count: number): string[] {
  const articleTitle = (body.article?.title ?? '').trim()
  const fallbackTitle = articleTitle || 'A transition pattern we keep seeing in executive search'
  const summary = truncate(safeSummary(body.article?.summary, fallbackTitle))
  const takeaway = truncate((body.article?.keyTakeaways ?? []).find(Boolean)?.trim() ?? summary, 320)
  const claim = truncate((body.article?.claim ?? '').trim() || 'Execution quality between sessions is where search outcomes diverge.', 240)
  const cta = (body.article?.cta ?? '').trim() || 'If this matches what you are seeing, reply and I can share the full framework.'

  const openers = [
    `Most senior transitions do not fail in interviews. They fail in the middle.`,
    `The expensive miss in executive search is usually timing, not talent.`,
    `Search momentum breaks long before anyone notices it in a CRM.`
  ]

  const templates = [
    `${openers[0]}\n\n${takeaway}\n\n${claim}\n\n${cta}\n\n#executivesearch #leadership #careerstrategy`,
    `${openers[1]}\n\n${summary}\n\nWhat changed our results was treating execution as a daily operating system, not a weekly intention.\n\n${cta}\n\n#executivesearch #marketintel #leadership`,
    `${openers[2]}\n\n${summary}\n\nOne practical rule: every conversation ends with a dated next action and owner. Drift drops fast when this is enforced.\n\n${cta}\n\n#executivecoaching #executivesearch #operations`
  ]

  const variants: string[] = []
  for (let i = 0; i < count; i += 1) {
    variants.push(templates[i % templates.length])
  }
  return variants
}

function normalizeVariantCount(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 3
  return Math.min(5, Math.max(1, Math.floor(value)))
}

function normalizeStartDate(value: string | undefined): Date {
  if (!value) return new Date()
  const parsed = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return new Date()
  return parsed
}

function getTokenValue(notes: string | null | undefined, key: string): string | null {
  if (!notes) return null
  const prefix = `${key}=`
  const token = notes
    .split('|')
    .map(part => part.trim())
    .find(part => part.startsWith(prefix))
  if (!token) return null
  const value = token.slice(prefix.length).trim()
  return value || null
}

function buildHistoryRuns(rows: Array<{ id: string; post_date: string; generated_at: string; notes: string | null }>): HandoffHistoryRun[] {
  const map = new Map<string, HandoffHistoryRun>()

  for (const row of rows) {
    const batchId = getTokenValue(row.notes, 'batch_id') ?? `legacy-${row.id}`
    const articleTitle = getTokenValue(row.notes, 'article_title')

    if (!map.has(batchId)) {
      map.set(batchId, {
        batchId,
        createdAt: row.generated_at,
        articleTitle,
        dates: [row.post_date],
      })
      continue
    }

    const run = map.get(batchId)
    if (!run) continue
    if (!run.dates.includes(row.post_date)) run.dates.push(row.post_date)
    if (!run.articleTitle && articleTitle) run.articleTitle = articleTitle
    if (row.generated_at > run.createdAt) run.createdAt = row.generated_at
  }

  return Array.from(map.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(run => ({ ...run, dates: [...run.dates].sort() }))
    .slice(0, 5)
}

export async function GET(request: NextRequest) {
  const sessionAuth = await requireAuth(request)
  if (!sessionAuth.ok) return sessionAuth.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('social_posts')
    .select('id, post_date, generated_at, notes')
    .ilike('notes', '%source=approved_handoff%')
    .order('generated_at', { ascending: false })
    .limit(80)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ runs: buildHistoryRuns(data ?? []) })
}

export async function POST(request: NextRequest) {
  const sessionAuth = await requireAuth(request)
  if (!sessionAuth.ok) return sessionAuth.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  let body: ApprovedHandoffBody
  try {
    body = await request.json() as ApprovedHandoffBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if ((body.approvalStatus ?? '').toLowerCase() !== 'approved') {
    return NextResponse.json({ error: 'Only approved content can be handed off' }, { status: 400 })
  }

  const pillar: SocialPillar = ALLOWED_PILLARS.has(body.pillar as SocialPillar)
    ? (body.pillar as SocialPillar)
    : 'market_intel'

  const variantCount = normalizeVariantCount(body.variantCount)
  const variants = buildVariants(body, variantCount)
  const startDate = normalizeStartDate(body.startDate)

  const admin = createAdminClient()

  // Pull enough candidates and remove dates already occupied by existing social rows.
  const candidateDates = getNextSocialPostDays(startDate, variantCount + 24)
  const { data: existingRows, error: existingError } = await admin
    .from('social_posts')
    .select('post_date')
    .in('post_date', candidateDates)

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  const takenDates = new Set((existingRows ?? []).map(row => row.post_date))
  const openDates = candidateDates.filter(date => !takenDates.has(date)).slice(0, variantCount)

  if (openDates.length < variantCount) {
    return NextResponse.json({
      error: 'Not enough open posting slots in the current social queue',
      requested: variantCount,
      available: openDates.length,
    }, { status: 409 })
  }

  const articleTitle = (body.article?.title ?? '').trim() || 'Untitled approved content'
  const sourceUrl = (body.article?.url ?? '').trim()
  const audience = (body.audience ?? '').trim()
  const batchId = globalThis.crypto.randomUUID()

  const inserts = openDates.map((date, index) => {
    const noteParts = [
      'approval_status=approved',
      'source=approved_handoff',
      `batch_id=${batchId}`,
      `article_title=${articleTitle}`,
      sourceUrl ? `article_url=${sourceUrl}` : '',
      audience ? `audience=${audience}` : '',
      `variant=${index + 1}/${variantCount}`,
    ].filter(Boolean)

    return {
      post_date: date,
      pillar,
      draft_text: variants[index],
      notes: noteParts.join(' | '),
    }
  })

  const { data: created, error: insertError } = await admin
    .from('social_posts')
    .insert(inserts)
    .select('id, post_date, pillar, draft_text, notes')

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    batchId,
    queued: created?.length ?? 0,
    posts: created ?? [],
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
