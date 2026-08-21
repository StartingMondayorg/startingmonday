import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SuggestedPerson } from '@/lib/enrichment'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { RecommendationActions } from './recommendation-actions'
import { Badge, Card } from '@/components/ui'
function fitBadgeVariant(fit: number): 'success' | 'warning' | 'secondary' {
  if (fit >= 8) return 'success'
  if (fit >= 6) return 'warning'
  return 'secondary'
}

export default async function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type RecommendationRow = {
    id: string
    name: string
    sector: string
    why: string
    fit: number
    key_signals: string[]
    key_attributes: string[]
    suggested_people: unknown
  }

  const { data: recommendation } = await (supabase as any)
    .from('company_recommendations')
    .select('id, name, sector, why, fit, key_signals, key_attributes, suggested_people')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!recommendation) notFound()
  const row = recommendation as RecommendationRow

  const people = Array.isArray(row.suggested_people)
    ? (row.suggested_people as SuggestedPerson[]).slice(0, 3)
    : []

  const prepFitScore = Math.max(0, Math.min(100, Math.round(((row.fit ?? 0) / 10) * 100)))
  const prepSignalScore = Math.max(0, Math.min(100, ((row.key_signals ?? []).length * 25)))
  const prepAttributeScore = Math.max(0, Math.min(100, ((row.key_attributes ?? []).length * 25)))
  const highConfidencePeopleCount = people.filter((person) => (person.confidence ?? 0) >= 0.7).length
  const prepPeopleScore = people.length > 0 ? Math.round((highConfidencePeopleCount / people.length) * 100) : 0
  const prepQualityScore = Math.round((prepFitScore * 0.4) + (prepSignalScore * 0.2) + (prepAttributeScore * 0.2) + (prepPeopleScore * 0.2))

  const openProps = {
    recommendation_id: row.id,
    fit: row.fit,
    suggested_people_count: people.length,
    prep_quality_score: prepQualityScore,
    prep_fit_score: prepFitScore,
    prep_signal_score: prepSignalScore,
    prep_attribute_score: prepAttributeScore,
    prep_people_score: prepPeopleScore,
    mode: 'dashboard_discover',
    confidence_band: 'medium',
    action_context: 'discover_recommendation_open',
  }
  await logEvent(user.id, 'discover_recommendation_opened', openProps)
  captureServerEvent(user.id, 'discover_recommendation_opened', openProps)

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard/discover" className="text-[13px] text-primary-foreground hover:text-primary-foreground transition-colors">
            &larr; Discover
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Card variant="default" className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-[28px] font-bold text-foreground leading-tight">{row.name}</h1>
            <Badge variant={fitBadgeVariant(row.fit ?? 6)} className="shrink-0 text-[13px] font-bold px-2.5 py-1">
              {(row.fit ?? 6)}/10
            </Badge>
          </div>
          <p className="text-[13px] tracking-[0.1em] text-muted-foreground font-semibold mb-5">{row.sector}</p>

          <section className="mb-6">
            <h2 className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold mb-2">Why This Company</h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed">{row.why}</p>
          </section>

          <section className="mb-6">
            <h2 className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold mb-2">Key Signals</h2>
            <ul className="space-y-2">
              {(row.key_signals ?? []).map((signal: string) => (
                <li key={signal} className="text-[14px] text-muted-foreground">- {signal}</li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold mb-2">Key Attributes Match</h2>
            <ul className="space-y-2">
              {(row.key_attributes ?? []).map((attribute: string) => (
                <li key={attribute} className="text-[14px] text-muted-foreground">- {attribute}</li>
              ))}
            </ul>
          </section>

          <section className="mb-7">
            <h2 className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold mb-2">Suggested Outreach People</h2>
            {people.length === 0 ? (
              <p className="text-[14px] text-muted-foreground">No people suggested yet. Regenerate this recommendation after enrichment is enabled.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.map((person) => (
                  <Card key={`${person.name}-${person.title}`} variant="default" className="bg-muted p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-semibold text-foreground">{person.name}</div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="bg-card text-[13px] font-semibold tracking-[0.08em] text-muted-foreground">
                          {person.source}
                        </Badge>
                        <Badge variant="outline" className="bg-card text-[13px] font-semibold text-muted-foreground">
                          {Math.round((person.confidence ?? 0) * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-[13px] text-muted-foreground mb-1">{person.title}</div>
                    <div className="text-[13px] text-muted-foreground">{person.reason}</div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Card variant="default" className="mb-7 p-4 bg-muted">
            <h2 className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold mb-2">Prep Quality Scorecard</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Card variant="default" className="px-2.5 py-2">
                <p className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold">Overall</p>
                <p className="text-[16px] font-bold text-foreground">{prepQualityScore}</p>
              </Card>
              <Card variant="default" className="px-2.5 py-2">
                <p className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold">Role Fit</p>
                <p className="text-[16px] font-bold text-foreground">{prepFitScore}</p>
              </Card>
              <Card variant="default" className="px-2.5 py-2">
                <p className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold">Signals</p>
                <p className="text-[16px] font-bold text-foreground">{prepSignalScore}</p>
              </Card>
              <Card variant="default" className="px-2.5 py-2">
                <p className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold">Attributes</p>
                <p className="text-[16px] font-bold text-foreground">{prepAttributeScore}</p>
              </Card>
              <Card variant="default" className="px-2.5 py-2">
                <p className="text-[13px] tracking-[0.08em] text-muted-foreground font-bold">People</p>
                <p className="text-[16px] font-bold text-foreground">{prepPeopleScore}</p>
              </Card>
            </div>
            <p className="text-[13px] text-muted-foreground mt-3">
              Guidance: if score is below 65, strengthen role-fit evidence and convert at least one high-confidence suggested person into a live outreach thread.
            </p>
          </Card>

          <RecommendationActions
            companyName={row.name}
            sector={row.sector ?? ''}
            suggestedPeople={people}
          />
        </Card>
      </main>
    </div>
  )
}

