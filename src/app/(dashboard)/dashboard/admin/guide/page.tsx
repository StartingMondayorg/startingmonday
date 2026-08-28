import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { Card } from '@/components/ui'
type GuideManifest = {
  generatedAt?: string
  sourceFileCount?: number
  entryCount?: number
  changedEntryCount?: number
}

type RetrievalEvalReport = {
  generatedAt?: string
  summary?: {
    recallAt1?: number
    recallAt3?: number
    recallAt5?: number
    total?: number
    misses?: Array<unknown>
  }
}

function toPercent(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return `${(value * 100).toFixed(1)}%`
}

async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  const raw = await readFile(filePath, 'utf8').catch(() => '')
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export default async function AdminGuidePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const since7d = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString()

  const [manifest, evalReport, queryCounts, topQueries, lowConfidenceQueries] = await Promise.all([
    readJsonSafe<GuideManifest>(path.join(process.cwd(), 'docs', 'user-guide.manifest.json')),
    readJsonSafe<RetrievalEvalReport>(path.join(process.cwd(), 'docs', 'guide-retrieval-eval.latest.json')),
    Promise.all([
      (admin as any).from('guide_chat_queries').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
      (admin as any).from('guide_chat_queries').select('id', { count: 'exact', head: true }).eq('query_status', 'no_match').gte('created_at', since7d),
      (admin as any).from('guide_chat_queries').select('id', { count: 'exact', head: true }).eq('query_status', 'low_confidence').gte('created_at', since7d),
      (admin as any).from('guide_chat_feedback').select('id', { count: 'exact', head: true }).eq('rating', 'not_helpful').gte('created_at', since7d),
    ]),
    (admin as any)
      .from('guide_chat_queries')
      .select('question')
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(300),
    (admin as any)
      .from('guide_chat_queries')
      .select('question,confidence,top_source_url')
      .eq('query_status', 'low_confidence')
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const totalQueries7d = queryCounts[0].count ?? 0
  const noMatch7d = queryCounts[1].count ?? 0
  const lowConfidence7d = queryCounts[2].count ?? 0
  const notHelpful7d = queryCounts[3].count ?? 0

  const questionMap = new Map<string, number>()
  for (const row of (topQueries.data ?? []) as Array<{ question: string }>) {
    const key = (row.question ?? '').trim().toLowerCase()
    if (!key) continue
    questionMap.set(key, (questionMap.get(key) ?? 0) + 1)
  }
  const topQuestionRows = [...questionMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Back to Admin</Link>
            <Link href="/guide" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Open Guide</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Guide Reliability and Analytics</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Guide freshness, retrieval quality, and query performance in one panel.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="p-4">
            <div className="text-[24px] font-bold text-foreground leading-none">{manifest?.entryCount ?? 0}</div>
            <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">Guide entries</div>
          </Card>
          <Card className="p-4">
            <div className="text-[24px] font-bold text-foreground leading-none">{manifest?.changedEntryCount ?? 0}</div>
            <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">Changed on latest sync</div>
          </Card>
          <Card className="p-4">
            <div className="text-[24px] font-bold text-foreground leading-none">{toPercent(evalReport?.summary?.recallAt3)}</div>
            <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">Retrieval recall@3</div>
          </Card>
          <Card className="p-4">
            <div className="text-[24px] font-bold text-foreground leading-none">{totalQueries7d}</div>
            <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">Queries (7d)</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="p-5">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Freshness and quality status</h2>
            <div className="space-y-2 text-[13px] text-muted-foreground">
              <p>Manifest generated: {manifest?.generatedAt ?? 'N/A'}</p>
              <p>Source file count: {manifest?.sourceFileCount ?? 'N/A'}</p>
              <p>Eval generated: {evalReport?.generatedAt ?? 'N/A'}</p>
              <p>Recall@1: {toPercent(evalReport?.summary?.recallAt1)}</p>
              <p>Recall@5: {toPercent(evalReport?.summary?.recallAt5)}</p>
              <p>Eval misses: {evalReport?.summary?.misses?.length ?? 0}</p>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Query risk signals (7d)</h2>
            <div className="space-y-2 text-[13px] text-muted-foreground">
              <p>No match: {noMatch7d}</p>
              <p>Low confidence: {lowConfidence7d}</p>
              <p>Not helpful feedback: {notHelpful7d}</p>
              <p>Low-confidence rate: {totalQueries7d > 0 ? `${Math.round((lowConfidence7d / totalQueries7d) * 100)}%` : 'N/A'}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Top repeated queries (7d)</h2>
            {topQuestionRows.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No guide queries captured yet.</p>
            ) : (
              <ol className="space-y-2 text-[13px] text-muted-foreground list-decimal list-inside">
                {topQuestionRows.map(([question, count]) => (
                  <li key={question}>{question} ({count})</li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Recent low-confidence queries</h2>
            {((lowConfidenceQueries.data ?? []) as Array<{ question: string; confidence: number | null; top_source_url: string | null }>).length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No low-confidence queries in the last 7 days.</p>
            ) : (
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                {((lowConfidenceQueries.data ?? []) as Array<{ question: string; confidence: number | null; top_source_url: string | null }>).map((row, index) => (
                  <li key={`${row.question}-${index}`}>
                    <p className="font-semibold">{row.question}</p>
                    <p className="text-[12px] text-muted-foreground">confidence {typeof row.confidence === 'number' ? `${Math.round(row.confidence * 100)}%` : 'N/A'} | top source {row.top_source_url ?? 'none'}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

