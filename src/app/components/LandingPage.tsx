import Link from 'next/link'
import Image from 'next/image'
import { TrackLink } from '@/app/components/TrackLink'
import { Button, Card } from '@/components/ui'
import { FirstMileTelemetry } from '@/app/components/FirstMileTelemetry'
import { HomepageBriefTeaser } from '@/app/components/HomepageBriefTeaser'
import { FirstWeekSpine, FirstWeekSpineCondensed, TrustLineCta } from '@/app/components/FirstWeekSpine'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { OpportunityTimingGapChart, OpportunityTimingGapChartMobile } from '@/app/components/OpportunityCharts'
import { SignalTimelineCard } from '@/app/components/SignalTimelineCard'
import { HERO_EVENT_NAMES } from '@/lib/channel-metrics-events'
import type { StartingMondayHeroProofCase } from '@/lib/starting-monday-hero-content'

export interface SituationCard {
  id: string
  headline: string
  sub: string
}

export interface FAQ {
  question: string
  answer: string
}

export interface LandingHero {
  eyebrow: string
  h1Lines: string[]
  claimMethodLabel?: string
  claimMethodHref?: string
  claimEvidenceLabel?: string
  claimEvidenceHref?: string
  bodyPreamble?: string
  body: string
  note?: string
  competitiveEdge?: string
  steps?: string[]
  trialNote: string
  testimonial?: {
    quote: string
    source: string
    result: string
  }
}

export interface ProofHighlight {
  metric: string
  detail: string
}

export interface LandingPageProps {
  hero: LandingHero
  situations: SituationCard[]
  faqs?: FAQ[]
  showPersonaSelector?: boolean
  showFirstWeekSpine?: boolean
  proofHighlights?: ProofHighlight[]
  sourcePage?: string
  experimentVariant?: 'control' | 'proof_first'
  brandWordmark?: {
    primary: string
    accent: string
  }
  heroEvidence?: {
    proofCase: StartingMondayHeroProofCase
    timelineAlt: string
    privacy: string
  }
}

type ExecutiveLaneBrand = {
  key: 'leadership' | 'technical-leadership' | 'delivery-leadership'
  label: string
  badgeClass: string
  borderClass: string
  panelClass: string
  proofToneClass: string
}

const MANAGERTOOLS_SIGNUP_URL = '/signup?utm_source=managertools&utm_medium=newsletter&utm_campaign=horstman-july2026'

const EXECUTIVE_LANE_BRANDS: Record<ExecutiveLaneBrand['key'], ExecutiveLaneBrand> = {
  leadership: {
    key: 'leadership',
    label: 'Leadership lane',
    badgeClass: 'bg-warning/20 text-warning border-warning/40',
    borderClass: '!border-warning/35',
    panelClass: '!bg-warning/10',
    proofToneClass: 'text-warning',
  },
  'technical-leadership': {
    key: 'technical-leadership',
    label: 'Technical leadership lane',
    badgeClass: 'bg-info/20 text-info border-info/40',
    borderClass: '!border-info/35',
    panelClass: '!bg-info/10',
    proofToneClass: 'text-info',
  },
  'delivery-leadership': {
    key: 'delivery-leadership',
    label: 'Delivery leadership lane',
    badgeClass: 'bg-success/20 text-success border-success/40',
    borderClass: '!border-success/35',
    panelClass: '!bg-success/10',
    proofToneClass: 'text-success',
  },
}

function executiveLaneFromSource(sourcePage: string): ExecutiveLaneBrand | null {
  const lane = sourcePage.startsWith('/for-executives/')
    ? sourcePage.replace('/for-executives/', '')
    : null

  if (!lane) return null
  if (lane === 'leadership' || lane === 'technical-leadership' || lane === 'delivery-leadership') {
    return EXECUTIVE_LANE_BRANDS[lane]
  }
  return null
}

const EXECUTIVE_FEATURE_MATRIX = [
  {
    feature: 'Leadership signal intelligence',
    whatYouGet: 'Track role-shaping movement before your dream role is publicly obvious.',
    whyItMatters: 'You enter while the role is still being defined, not after the shortlist is crowded.',
  },
  {
    feature: 'Audience-specific narrative system',
    whatYouGet: 'One core story adapted for board members, search partners, CHROs, and leadership peers.',
    whyItMatters: 'You stay consistent while still sounding precise for each decision-maker.',
  },
  {
    feature: 'Interview and objection preparation',
    whatYouGet: 'Role-specific prep prompts, risk framing, and likely objection rehearsal.',
    whyItMatters: 'You reduce unforced errors in high-stakes conversations and increase next-step conversion.',
  },
  {
    feature: 'Weekly operating cadence',
    whatYouGet: 'A repeatable weekly loop for targets, outreach, follow-up, and decision review.',
    whyItMatters: 'Sustained momentum replaces the stop-start pattern inherent in ad hoc scheduling.',
  },
]

const EXECUTIVE_DIFFERENTIATORS = [
  {
    category: 'Timing advantage',
    startingMonday: 'Built for pre-posting signal detection and early relationship entry.',
    otherTools: 'Optimized for posted jobs after demand is already concentrated.',
  },
  {
    category: 'Narrative quality',
    startingMonday: 'Role-level narrative tuned for multiple leadership audiences.',
    otherTools: 'Resume/profile optimization oriented toward broad applicant pools.',
  },
  {
    category: 'Execution model',
    startingMonday: 'Weekly operating system with accountability to outcomes.',
    otherTools: 'Task lists and alerts without a strategic leadership cadence.',
  },
  {
    category: 'Conversation readiness',
    startingMonday: 'Preparation workflows for recruiter, board, and C-suite dialogue.',
    otherTools: 'Generic interview tips that rarely map to leadership-level role discussions.',
  },
]

export function LandingPage({
  hero,
  faqs,
  proofHighlights,
  sourcePage = '/',
  experimentVariant = 'control',
  brandWordmark,
  showFirstWeekSpine = false,
  heroEvidence,
}: LandingPageProps) {
  const isManagerToolsPage = sourcePage === '/managertools'
  const isHomePage = sourcePage === '/' || isManagerToolsPage
  const isPersonaRoute = sourcePage.startsWith('/for-')
  const isExecutivesPage = sourcePage === '/for-executives' || sourcePage.startsWith('/for-executives/')
  const useCenteredFooter = isManagerToolsPage || isExecutivesPage
  const executiveLaneBrand = executiveLaneFromSource(sourcePage)
  const showHeroEvidence = sourcePage === '/' && Boolean(heroEvidence?.proofCase)
  const isLeadershipLanePage = executiveLaneBrand?.key === 'leadership'
  const heroPrimaryHref = isManagerToolsPage
    ? MANAGERTOOLS_SIGNUP_URL
    : isExecutivesPage
      ? '/shortlist-sprint?utm_source=executives&utm_medium=landing&utm_campaign=shortlist-sprint'
      : '/concierge?program=beta&from=landing'
  const heroPrimaryLabel = isManagerToolsPage
    ? 'Get 60 days free'
    : isExecutivesPage
      ? 'Begin 7-day shortlist sprint'
      : 'Begin now'
  const wordmarkPrimary = brandWordmark?.primary ?? 'Starting'
  const wordmarkAccent = brandWordmark?.accent ?? 'Monday'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      {isHomePage && <FirstMileTelemetry eventName="homepage_viewed" pageName="homepage" properties={{ source_page: sourcePage }} />}
      <nav className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-foreground/95 transition-opacity hover:opacity-80 inline-flex items-center min-h-[48px]" aria-label="Go to homepage">
            <span className="text-foreground">{wordmarkPrimary} </span><span className="text-primary">{wordmarkAccent}</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Button
              className="min-h-[48px] rounded px-3.5 text-[13px] font-bold"
              aria-label={isManagerToolsPage ? 'Get 60 days free' : isHomePage ? 'Get access' : 'Sign up'}
              render={
                <TrackLink
                  href={isManagerToolsPage ? MANAGERTOOLS_SIGNUP_URL : '/signup'}
                  event={isHomePage ? 'homepage_cta_clicked' : EVENT_NAMES.channelEntryClicked}
                  logToUserEvents
                  properties={{
                    channel: 'executives',
                    cta_label: isManagerToolsPage ? 'nav_manager_tools_signup' : isHomePage ? 'nav_home_signup' : 'nav_signup',
                    source_page: sourcePage,
                  }}
                />
              }
            >
              {isManagerToolsPage ? 'Get 60 days free' : isHomePage ? 'Get access' : 'Sign Up'}
            </Button>
            <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[48px] px-3" aria-label="Log in">
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative">
        <section id="core-clarity" data-emi-section="clarity_block" data-first-mile-section="homepage_hero" className="px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            {isManagerToolsPage && (
              <div className="mb-6">
                <p className="text-[1.4rem] font-semibold leading-tight tracking-tight text-primary sm:text-[1.75rem]">
                  Welcome, Manager Tools community
                </p>
                <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
                  You are here from &ldquo;Things We Think We Think.&rdquo; Starting Monday applies the discipline you already practice: relationships first, executed on a weekly cadence.
                </p>
              </div>
            )}
            {isHomePage ? (
              <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
                <Card variant="glass" className="rounded-[2rem] !border-border !bg-background/82 p-6 shadow-2xl sm:p-8 lg:p-10">
                  <p className="max-w-3xl text-[1.15rem] font-semibold leading-[1.18] tracking-tight text-primary/90 sm:text-[1.35rem] lg:text-[1.55rem]">
                    {hero.eyebrow}
                  </p>
                  <h1 className="font-display mt-4 max-w-4xl text-[2rem] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-[2.6rem] lg:text-[3.4rem]">
                    {hero.h1Lines.map((line, i) => (
                      <span key={i}>{line}{i < hero.h1Lines.length - 1 && <br />}</span>
                    ))}
                  </h1>
                  {hero.bodyPreamble && !isHomePage && (
                    <p className="mt-4 max-w-3xl text-[12px] font-semibold uppercase tracking-[0.12em] text-primary/90 sm:text-[13px]">
                      {hero.bodyPreamble}
                    </p>
                  )}
                  <p className={`mt-5 max-w-4xl font-semibold tracking-tight text-foreground/95 ${showHeroEvidence ? 'text-base leading-relaxed sm:text-lg' : 'text-[1.35rem] leading-[1.12] sm:text-[1.7rem] lg:text-[2.24rem]'}`}>
                    {hero.body}
                  </p>
                  {hero.competitiveEdge && (
                    <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-muted-foreground/90 sm:text-[15px] [text-wrap:pretty]">
                      {hero.competitiveEdge}
                    </p>
                  )}
                  {isManagerToolsPage && (
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        className="shrink-0 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                        render={
                          <TrackLink
                            href={heroPrimaryHref}
                            event={EVENT_NAMES.channelEntryClicked}
                            logToUserEvents
                            properties={{
                              channel: 'executives',
                              cta_label: 'hero_manager_tools_signup',
                              source_page: sourcePage,
                              variant_key: `landing_${experimentVariant}`,
                              experiment_variant: experimentVariant,
                            }}
                          />
                        }
                      >
                        {heroPrimaryLabel}
                      </Button>
                      <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">{hero.trialNote}</p>
                    </div>
                  )}
                </Card>
                <div className="relative mx-auto min-h-[480px] w-full max-w-[390px] lg:mx-0 lg:mt-10 lg:justify-self-end">
                  {showHeroEvidence && heroEvidence ? (
                    <SignalTimelineCard proofCase={heroEvidence.proofCase} altText={heroEvidence.timelineAlt} />
                  ) : (
                    <div className="relative h-[480px] w-full overflow-hidden rounded-[1.6rem] border border-border shadow-xl">
                      <Image
                        src="/hero-offer-letter.webp"
                        alt="Executive reading her employment offer, hand to heart, with a city skyline behind her"
                        fill
                        sizes="(max-width: 640px) 92vw, 390px"
                        preload
                        fetchPriority="high"
                        quality={75}
                        className="object-cover object-center"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="max-w-3xl text-base font-semibold leading-relaxed text-primary/90 sm:text-xl sm:leading-relaxed whitespace-pre-line [text-wrap:balance]">
                  {hero.eyebrow}
                </p>
                <h1 className="mt-4 max-w-4xl text-[2.6rem] font-bold leading-[1.06] tracking-tight text-foreground sm:text-5xl [text-wrap:balance]">
                  {hero.h1Lines.map((line, i) => (
                    <span key={i}>{line}{i < hero.h1Lines.length - 1 && <br />}</span>
                  ))}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/90 [text-wrap:pretty]">
                  {hero.body}
                </p>
              </>
            )}
            {showHeroEvidence && heroEvidence && (
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center" data-hero-evidence-actions>
                <Button
                  className="min-h-[48px] rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                  render={
                    <TrackLink
                      href="/signup"
                      event={HERO_EVENT_NAMES.getAccessClick}
                      properties={{ source_page: '/', cta_label: 'hero_get_access' }}
                    />
                  }
                >
                  Get access
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[48px] rounded-full !border-info/40 px-6 py-3 text-[14px] font-semibold !text-info !bg-transparent hover:!border-info/30 hover:!bg-info/10"
                  render={
                    <TrackLink
                      href="/example"
                      event={HERO_EVENT_NAMES.exampleClick}
                      properties={{ source_page: '/', cta_label: 'hero_live_example' }}
                    />
                  }
                >
                  See a live example
                </Button>
              </div>
            )}
            {experimentVariant === 'proof_first' && proofHighlights && proofHighlights.length > 0 && (
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3" data-emi-proof="executive_outcomes_grid">
                {proofHighlights.map((item) => (
                  <Card key={item.metric} variant="glass" className="p-5 shadow-xl">
                    <p className="mb-2 text-[13px] font-semibold leading-snug text-primary">{item.metric}</p>
                    <p className="text-[13px] leading-relaxed text-foreground/90">{item.detail}</p>
                  </Card>
                ))}
              </div>
            )}

            {!isHomePage && (
              <div className="mt-8 mb-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                  render={
                    <TrackLink
                      href={heroPrimaryHref}
                      event={EVENT_NAMES.channelEntryClicked}
                      logToUserEvents
                      properties={{
                        channel: 'executives',
                        cta_label: 'hero_apply_beta',
                        source_page: sourcePage,
                        variant_key: `landing_${experimentVariant}`,
                        experiment_variant: experimentVariant,
                      }}
                    />
                  }
                >
                  {heroPrimaryLabel}
                </Button>
              </div>
            )}

            {isHomePage && (
              <section className="mb-12" aria-labelledby="homepage-trust-title">
                <h2 id="homepage-trust-title" className="sr-only">Trust assurance</h2>
                <p className="max-w-3xl text-[13px] font-semibold uppercase tracking-[0.12em] text-primary/90">
                  {showHeroEvidence && heroEvidence ? heroEvidence.privacy : 'Private by default. You control every signal and every share.'}
                </p>
              </section>
            )}



            {isExecutivesPage && (
              <Card variant="glass" className="mb-6 rounded-[1.75rem] !border-border !bg-background/64 p-5 shadow-2xl sm:p-6" aria-labelledby="executive-differentiation-title">
                <div className="flex flex-col gap-2 mb-5">
                  {executiveLaneBrand && (
                    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${executiveLaneBrand.badgeClass}`}>
                      {executiveLaneBrand.label}
                    </span>
                  )}
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{isLeadershipLanePage ? 'Leadership platform capabilities' : 'Leader platform capabilities'}</p>
                  <h2 id="executive-differentiation-title" className="text-[22px] font-bold leading-snug text-foreground sm:text-[24px]">
                    All essentials in one operating view.
                  </h2>
                  <p className="max-w-3xl text-[14px] leading-relaxed text-foreground/90">
                    {isLeadershipLanePage
                      ? 'Starting Monday is designed for leadership transitions that require earlier timing, sharper narrative control, and disciplined weekly execution.'
                      : 'Starting Monday is designed for leadership-transition behavior: earlier timing, sharper role narrative, and disciplined weekly execution.'}
                  </p>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {EXECUTIVE_FEATURE_MATRIX.map((item) => {
                    const featureTitle = isLeadershipLanePage && item.feature === 'Leadership signal intelligence'
                      ? 'Leadership signal intelligence'
                      : item.feature
                    const whatYouGet = isLeadershipLanePage && item.feature === 'Audience-specific narrative system'
                      ? 'One core story adapted for board members, search partners, CHROs, and leadership peers.'
                      : item.whatYouGet
                    const whyItMatters = isLeadershipLanePage && item.feature === 'Weekly operating cadence'
                      ? 'Sustained momentum replaces the stop-start pattern common in ad hoc leadership searches.'
                      : item.whyItMatters

                    return (
                    <Card key={item.feature} variant="glass" className="p-4">
                      <p className="mb-2 text-[13px] font-semibold text-foreground">{featureTitle}</p>
                      <p className="mb-2 text-[12px] leading-relaxed text-foreground/90">{whatYouGet}</p>
                      <p className="text-[12px] leading-relaxed text-success">{whyItMatters}</p>
                    </Card>
                    )
                  })}
                </div>

                <Card variant="glass" className="overflow-hidden py-0">
                  <div className="grid grid-cols-1 border-b border-border text-[11px] font-bold uppercase tracking-[0.1em] sm:grid-cols-[1.2fr_1fr_1fr]">
                    <p className="px-4 py-3 text-muted-foreground">Decision area</p>
                    <p className="border-t border-border px-4 py-3 text-success sm:border-t-0 sm:border-l">Starting Monday</p>
                    <p className="border-t border-border px-4 py-3 text-muted-foreground sm:border-t-0 sm:border-l">Typical job products</p>
                  </div>
                  {EXECUTIVE_DIFFERENTIATORS.map((row) => (
                    <div key={row.category} className="grid grid-cols-1 border-b border-border last:border-b-0 sm:grid-cols-[1.2fr_1fr_1fr]">
                      <p className="px-4 py-3 text-[12px] font-semibold text-foreground">{row.category}</p>
                      <p className="border-t border-border px-4 py-3 text-[12px] leading-relaxed text-foreground/90 sm:border-t-0 sm:border-l">{isLeadershipLanePage && row.category === 'Conversation readiness' ? 'Preparation workflows for recruiter, board, and leadership dialogue.' : row.startingMonday}</p>
                      <p className="border-t border-border px-4 py-3 text-[12px] leading-relaxed text-muted-foreground sm:border-t-0 sm:border-l">{row.otherTools}</p>
                    </div>
                  ))}
                </Card>

                {executiveLaneBrand && (
                  <Card className={`mt-5 !rounded-2xl border ${executiveLaneBrand.borderClass} ${executiveLaneBrand.panelClass} p-4 sm:p-5`}>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${executiveLaneBrand.proofToneClass} mb-2`}>
                      Trust and proof guardrails
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Card variant="glass" className="!rounded-xl !bg-background/55 p-3">
                        <p className="text-[12px] font-semibold text-foreground mb-1">Confidential by design</p>
                        <p className="text-[12px] leading-relaxed text-muted-foreground">Your identity, targets, and activity are not shared with employers or recruiters.</p>
                      </Card>
                      <Card variant="glass" className="!rounded-xl !bg-background/55 p-3">
                        <p className="text-[12px] font-semibold text-foreground mb-1">Claim discipline</p>
                        <p className="text-[12px] leading-relaxed text-muted-foreground">Numeric statements are denominator-aware and directional unless explicitly audited.</p>
                      </Card>
                      <Card variant="glass" className="!rounded-xl !bg-background/55 p-3">
                        <p className="text-[12px] font-semibold text-foreground mb-1">Evidence path</p>
                        <p className="text-[12px] leading-relaxed text-muted-foreground">Review method, references, and source notes before any decision gate.</p>
                      </Card>
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed text-foreground">
                      Source: documented methods with source notes and confidence context.{' '}
                      <Link href="/method-and-evidence" className="underline underline-offset-2 hover:text-foreground">Method and evidence</Link>
                      {' · '}
                      <Link href="/evidence-hub" className="underline underline-offset-2 hover:text-foreground">Evidence hub</Link>
                    </p>
                  </Card>
                )}
              </Card>
            )}


          </div>
        </section>

        {isHomePage && showFirstWeekSpine && (
          <>
            <section className="border-b border-border bg-background/80 px-4 py-16 sm:px-6 sm:py-24 [content-visibility:auto] [contain-intrinsic-size:1px_900px]" data-first-mile-section="homepage_how_it_works">
              <div className="mx-auto max-w-5xl">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
                <h2 className="font-display mb-8 text-[28px] font-semibold leading-[1.06] text-foreground sm:text-[36px]">
                  How The Monday Engine Works
                </h2>
                {hero.steps && hero.steps.length > 0 && (
                  <ol className="mb-8 space-y-4">
                    {hero.steps.map((step, i) => (
                      <li key={step} className="flex gap-4">
                        <span className="font-display shrink-0 text-[20px] font-semibold leading-none text-primary">{i + 1}</span>
                        <p className="max-w-3xl text-[15px] leading-relaxed text-foreground/95">{step}</p>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button
                    className="rounded-full px-6 py-3 text-[14px] font-semibold"
                    render={
                      <TrackLink
                        href="/evidence-hub#early-signals"
                        event="homepage_cta_clicked"
                        logToUserEvents
                        properties={{
                          channel: 'executives',
                          cta_label: 'homepage_evidence_explore',
                          source_page: sourcePage,
                        }}
                      />
                    }
                  >
                    Explore the evidence →
                  </Button>
                  <Link
                    href="/learn-more"
                    className="text-[14px] font-semibold text-primary underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Read the full method
                  </Link>
                </div>
                <Card variant="glass" className="mt-10 p-6 sm:p-8">
                  <OpportunityTimingGapChart className="hidden h-auto w-full sm:block" />
                  <OpportunityTimingGapChartMobile className="h-auto w-full sm:hidden" />
                </Card>
              </div>
            </section>

            <FirstWeekSpine />

            <HomepageBriefTeaser ctaAsTextLink={false} />

            <TrustLineCta ctaHref="/signup" ctaLabel="Get access" />
          </>
        )}

        {isHomePage && !showFirstWeekSpine && (
          <>
            <section className="border-b border-border bg-background/80 px-4 py-16 sm:px-6 sm:py-24 [content-visibility:auto] [contain-intrinsic-size:1px_1100px]" data-first-mile-section="homepage_how_it_works">
              <div className="mx-auto max-w-5xl">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
                <h2 className="font-display mb-4 text-[28px] font-semibold leading-[1.06] text-foreground sm:text-[36px]">
                  How The Monday Engine Works
                </h2>

                <article className="mb-12">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">1. Detect readiness early</p>
                  <p className="mb-4 max-w-3xl text-[15px] leading-relaxed text-foreground/95">
                    The best opportunities are decided in private before they are posted in public. Starting Monday helps you act while the mandate is still forming, not after the shortlist hardens.
                  </p>
                  <Button
                    variant={isManagerToolsPage ? 'link' : undefined}
                    className={isManagerToolsPage
                      ? 'mb-8 h-auto p-0 text-[14px] font-semibold underline underline-offset-4'
                      : 'mb-8 rounded-full px-6 py-3 text-[14px] font-semibold'}
                    render={
                      <TrackLink
                        href="/evidence-hub#early-signals"
                        event="homepage_cta_clicked"
                        logToUserEvents
                        properties={{
                          channel: 'executives',
                          cta_label: 'homepage_evidence_explore',
                          source_page: sourcePage,
                        }}
                      />
                    }
                  >
                    Explore the evidence →
                  </Button>
                  <Card variant="glass" className="mt-8 p-6 sm:p-8">
                    <OpportunityTimingGapChart className="hidden h-auto w-full sm:block" />
                    <OpportunityTimingGapChartMobile className="h-auto w-full sm:hidden" />
                  </Card>
                </article>

                <article className="mb-12">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">2. Build internal advocates</p>
                  <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-foreground/95">
                    Instead of starting with an application, identify the people shaping the role and engage with problem-level context before process formalizes.
                  </p>
                  <div className="space-y-3 text-[14px] leading-relaxed text-foreground">
                    <p><span className="font-semibold text-foreground">Map mandate influence.</span> Focus on budget owners, operators, and advisors shaping the decision.</p>
                    <p><span className="font-semibold text-foreground">Engage with relevance.</span> Show command of the business pressure behind the role.</p>
                  </div>
                </article>

                <article>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">3. Execute weekly Monday cadence</p>
                  <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-foreground/95">
                    Progress compounds when momentum is scheduled. Revisit priorities weekly, sharpen narrative from live feedback, and move key relationships forward with intent.
                  </p>
                  <blockquote className="font-display border-l-2 border-primary/70 pl-4 text-[22px] leading-tight text-foreground sm:text-[26px]">
                    Momentum is designed before the first meeting.
                  </blockquote>
                </article>
              </div>
            </section>

            <HomepageBriefTeaser ctaAsTextLink={isManagerToolsPage} />
          </>
        )}

        {isPersonaRoute && <FirstWeekSpineCondensed />}

        {(!isHomePage || isManagerToolsPage) && (
          <section id="next-step" data-emi-section="next_step_block" data-first-mile-section="homepage_next_step" className="border-b border-border bg-background/80 px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-5xl mx-auto">
              {isManagerToolsPage ? (
                <>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Manager Tools next step</p>
                  <h2 className="mb-6 text-[22px] font-bold leading-snug text-foreground">
                    For managers and leaders in transition.
                  </h2>
                  <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-foreground/90">
                    You would be joining the founding Manager Tools cohort. Early members get a direct feedback line to the team building Starting Monday and help shape where the product goes next.
                  </p>
                  {faqs && faqs.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {faqs.map((faq) => (
                        <Card key={faq.question} variant="glass" className="px-4 py-3">
                          <p className="text-[13px] font-semibold text-foreground">{faq.question}</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{faq.answer}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                      render={
                        <TrackLink
                          href={MANAGERTOOLS_SIGNUP_URL}
                          event={EVENT_NAMES.channelEntryClicked}
                          logToUserEvents
                          properties={{
                            channel: 'executives',
                            cta_label: 'next_step_manager_tools_signup',
                            source_page: sourcePage,
                          }}
                        />
                      }
                    >
                      Get 60 days free
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full px-6 py-3 text-[14px] font-bold"
                      render={
                        <TrackLink
                          href="/feedback"
                          event={EVENT_NAMES.channelEntryClicked}
                          logToUserEvents
                          properties={{
                            channel: 'executives',
                            cta_label: 'next_step_manager_tools_feedback',
                            source_page: sourcePage,
                          }}
                        />
                      }
                    >
                      Submit feedback
                    </Button>
                  </div>
                </>
              ) : isExecutivesPage ? (
                <>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Leader outcomes</p>
                  <h2 className="mb-2 text-[22px] font-bold leading-snug text-foreground">
                    Build momentum in the first 30 days.
                  </h2>
                  <p className="mb-6 max-w-3xl text-[14px] leading-relaxed text-foreground/90">
                    Use your trial to sharpen narrative quality, improve conversation conversion, and create a weekly operating cadence you can keep through offer-stage decisions.
                  </p>
                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Card variant="glass" className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-foreground">Week 1</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Mandate narrative, role filter, and priority relationship map.</p>
                    </Card>
                    <Card variant="glass" className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-foreground">Week 2</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Signal tracking and audience-specific prep for recruiter and board conversations.</p>
                    </Card>
                    <Card variant="glass" className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-foreground">Week 3-4</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Consistent outreach rhythm and clearer conversion into high-quality next steps.</p>
                    </Card>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                      render={
                        <TrackLink
                          href="/signup?utm_source=executives&utm_medium=landing&utm_campaign=executive-page"
                          event={EVENT_NAMES.channelEntryClicked}
                          logToUserEvents
                          properties={{
                            channel: 'executives',
                            cta_label: 'next_step_executive_signup',
                            source_page: sourcePage,
                          }}
                        />
                      }
                    >
                      Begin your free trial
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full px-6 py-3 text-[14px] font-bold"
                      render={
                        <TrackLink
                          href="/demo/executive-brief"
                          event={EVENT_NAMES.channelEntryClicked}
                          logToUserEvents
                          properties={{
                            channel: 'executives',
                            cta_label: 'next_step_executive_demo',
                            source_page: sourcePage,
                          }}
                        />
                      }
                    >
                      Preview leader brief
                    </Button>
                  </div>
                </>
            ) : (
              <>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Why it feels different</p>
                <h2 className="mb-4 text-[24px] font-bold leading-tight text-foreground sm:text-[28px]">
                  Most leaders search in isolation. Starting Monday helps you build the relationships that matter.
                </h2>
                <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-foreground/90">
                  You are not casting nets into crowded windows. You are having targeted conversations with decision-makers before the market even knows the role exists. Starting Monday gives you clarity on who shapes real outcomes, focus on genuine relationships over noise, and control over timing when mandates crystallize. The difference feels immediate: by week one, you have moved from overwhelm to confidence, from scattered outreach to relationship leadership that converts.
                </p>
                <div className="mb-8 space-y-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">What shifts</p>
                  <ol className="space-y-3 text-[14px] leading-relaxed text-foreground">
                    <li className="flex gap-4">
                      <span className="font-semibold text-primary shrink-0">01</span>
                      <span>From isolated searching to strategic relationship building. You know who matters.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="font-semibold text-primary shrink-0">02</span>
                      <span>From scattered outreach to one refined narrative. Your authentic story, consistently delivered.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="font-semibold text-primary shrink-0">03</span>
                      <span>From hoping for outcomes to tracking real progress weekly. Relationships that convert.</span>
                    </li>
                  </ol>
                </div>
              </>
            )}
            <p className="mt-3 text-[12px] text-muted-foreground">{hero.trialNote}</p>
            </div>
          </section>
        )}

        <footer className="border-t border-border bg-background/80 px-4 py-10 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className={useCenteredFooter ? 'flex flex-col items-center gap-5' : 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'}>
              <span className={useCenteredFooter ? 'text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground text-center' : 'text-[12px] sm:text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground'}>
                <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
              </span>
              <div className={useCenteredFooter ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3 text-[12px] text-muted-foreground justify-items-center text-center' : 'flex items-center gap-4 sm:gap-5 flex-wrap text-[12px] text-muted-foreground'}>
                <Link href="/evidence-hub" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">Evidence hub</Link>
                <Link href="/blog" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">Blog</Link>
                <Link href="/about" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">About</Link>
                <a href="https://www.linkedin.com/company/starting-monday" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">LinkedIn</a>
                <Link href="/security" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">Security</Link>
                <Link href="/privacy" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">Privacy Policy</Link>
                <Link href="/terms" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-muted-foreground transition-colors px-1">Terms</Link>
              </div>
            </div>

            {useCenteredFooter ? (
              <p className="text-[11px] text-muted-foreground mt-5 text-center">
                Privacy-first by design. {' '}|{' '} &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-5">Privacy-first by design. {' '}|{' '} &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.</p>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}
