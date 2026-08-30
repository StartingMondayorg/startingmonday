import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LandingPage } from '@/app/components/LandingPage'
import type { SituationCard, FAQ } from '@/app/components/LandingPage'
import { getPublicRoleLaneTutorials, getRoleLaneTutorials, type PublicTutorialAsset } from '@/lib/role-lane-learning'
import type { RoleFamily } from '@/lib/role-taxonomy'

type LaneKey = 'leadership' | 'technical-leadership' | 'delivery-leadership'

type LaneConfig = {
  title: string
  description: string
  hero: {
    eyebrow: string
    h1Lines: string[]
    body: string
    trialNote: string
  }
  situations: SituationCard[]
  faqs: FAQ[]
  proofHighlights: Array<{ metric: string; detail: string }>
}

const LANE_CONFIG: Record<LaneKey, LaneConfig> = {
  leadership: {
    title: 'Leadership Lane',
    description: 'Role-lane transition infrastructure for managers, directors, AVPs, and VPs moving into broader leadership mandates.',
    hero: {
      eyebrow: 'Leadership transitions reward narrative precision and timing discipline.',
      h1Lines: ['Move from role scope to', 'mandate-level leadership fit.'],
      body: 'Use the leadership lane to sharpen recruiter and hiring-manager conversations with clear scope, evidence, and operating cadence.',
      trialNote: 'Free for 30 days. No credit card. No employer visibility.',
    },
    situations: [
      {
        id: 'mgr-director',
        headline: 'I am stepping from manager to director scope.',
        sub: 'I need a tighter leadership narrative and better recruiter signal timing.',
      },
      {
        id: 'director-vp',
        headline: 'I am targeting AVP or VP roles.',
        sub: 'I want scope evidence that stands up in executive hiring discussions.',
      },
      {
        id: 'vp-next',
        headline: 'I need stronger sponsor and search-partner alignment.',
        sub: 'I want fewer generic conversations and higher-quality next steps.',
      },
    ],
    faqs: [
      {
        question: 'Who should use the leadership lane?',
        answer: 'Leaders moving through manager, director, AVP, and VP transitions who need mandate-level positioning before shortlist windows close.',
      },
      {
        question: 'What changes versus generic executive guidance?',
        answer: 'You get leadership-scope framing and recruiter-ready outreach language built for role transitions rather than broad job-board activity.',
      },
    ],
    proofHighlights: [
      {
        metric: 'Cleaner leadership-scope narrative in first-touch outreach',
        detail: 'Lane-specific framing improves recruiter clarity and reduces generic response loops.',
      },
      {
        metric: 'Faster transition from signal to first quality conversation',
        detail: 'Structured cadence helps leadership candidates act earlier in role-shaping windows.',
      },
      {
        metric: 'Higher consistency across recruiter and hiring-manager audiences',
        detail: 'One core story adapted by audience avoids contradictory positioning.',
      },
    ],
  },
  'technical-leadership': {
    title: 'Technical Leadership Lane',
    description: 'Role-lane infrastructure for principals, architects, and technical leaders positioning for higher-scope mandates.',
    hero: {
      eyebrow: 'Technical depth only wins when it is translated into executive decision language.',
      h1Lines: ['Convert architecture depth into', 'technical leadership credibility.'],
      body: 'Use the technical leadership lane to package architecture, delivery tradeoffs, and influence proof for recruiter and panel conversations.',
      trialNote: 'Free for 30 days. No credit card. No employer visibility.',
    },
    situations: [
      {
        id: 'principal-architect',
        headline: 'I am a principal or architect targeting broader scope.',
        sub: 'I need a better way to make technical impact legible to executive audiences.',
      },
      {
        id: 'tech-lead-senior',
        headline: 'I am a technical lead stepping into senior leadership.',
        sub: 'I need interview narratives that connect architecture to business outcomes.',
      },
      {
        id: 'technical-influence',
        headline: 'My challenge is influence, not depth.',
        sub: 'I need cleaner language for sponsors, recruiters, and cross-functional leaders.',
      },
    ],
    faqs: [
      {
        question: 'Is this lane only for CTO candidates?',
        answer: 'No. It supports technical leads, principals, architects, and other senior technical leaders translating depth into role-fit evidence.',
      },
      {
        question: 'What is the practical output?',
        answer: 'A technical leadership narrative that connects architecture judgment, delivery reliability, and organizational influence to mandate needs.',
      },
    ],
    proofHighlights: [
      {
        metric: 'Technical story quality improves in recruiter first-touch drafts',
        detail: 'Lane copy focuses on impact and tradeoffs, not tool stacks and generic claims.',
      },
      {
        metric: 'Higher confidence in panel prep quality',
        detail: 'Technical interview drill prompts improve clarity under high-stakes questioning.',
      },
      {
        metric: 'Better role-fit consistency across technical and business audiences',
        detail: 'One narrative adapts cleanly for search partners, executives, and peer reviewers.',
      },
    ],
  },
  'delivery-leadership': {
    title: 'Delivery Leadership Lane',
    description: 'Role-lane infrastructure for TPMs and program leaders demonstrating execution judgment in transition.',
    hero: {
      eyebrow: 'Delivery leadership wins when execution risk and stakeholder control are explicit.',
      h1Lines: ['Show execution judgment', 'before interview pressure peaks.'],
      body: 'Use the delivery leadership lane to frame stakeholder alignment, dependency risk, and operating rhythm in recruiter and hiring-manager conversations.',
      trialNote: 'Free for 30 days. No credit card. No employer visibility.',
    },
    situations: [
      {
        id: 'tpm-scope',
        headline: 'I am a TPM moving into broader program leadership.',
        sub: 'I need stronger messaging around execution risk and cross-functional outcomes.',
      },
      {
        id: 'program-manager',
        headline: 'I am a program manager aiming for senior-level mandates.',
        sub: 'I need interviews and outreach to show operating judgment, not just task delivery.',
      },
      {
        id: 'delivery-upshift',
        headline: 'I need to prove strategic delivery leadership.',
        sub: 'I want a cadence that keeps follow-up quality high across long hiring cycles.',
      },
    ],
    faqs: [
      {
        question: 'Who benefits from the delivery lane?',
        answer: 'TPMs, program managers, and delivery leaders who need to demonstrate execution leadership and stakeholder control at higher scope.',
      },
      {
        question: 'How is this different from leadership lane messaging?',
        answer: 'Delivery lane guidance prioritizes dependency management, execution risk narratives, and cross-functional operating rhythm in outreach and prep.',
      },
    ],
    proofHighlights: [
      {
        metric: 'Stronger delivery-risk framing in recruiter outreach',
        detail: 'Lane-specific prompts improve message precision and reduce broad, low-signal follow-up.',
      },
      {
        metric: 'Higher prep quality for execution-focused interviews',
        detail: 'Structured prompts focus on stakeholder tradeoffs and operating cadence evidence.',
      },
      {
        metric: 'Cleaner week-to-week outreach cadence adherence',
        detail: 'Delivery lane workflows reinforce follow-up quality and timing discipline.',
      },
    ],
  },
}

function normalizeLane(value: string): LaneKey | null {
  if (value === 'leadership' || value === 'technical-leadership' || value === 'delivery-leadership') {
    return value
  }
  return null
}

function laneToRoleFamily(lane: LaneKey): RoleFamily {
  if (lane === 'technical-leadership') return 'technical_leadership'
  if (lane === 'delivery-leadership') return 'delivery_leadership'
  return 'leadership'
}

function tutorialFormatLabel(asset: PublicTutorialAsset): string {
  if (asset.format === 'chat_prompt') return 'Guided chat prompt'
  if (asset.format === 'video') return 'Focused guide'
  return 'Article guide'
}

export async function generateMetadata(
  { params }: { params: Promise<{ lane: string }> },
): Promise<Metadata> {
  const { lane } = await params
  const laneKey = normalizeLane(lane)
  if (!laneKey) {
    return {
      title: 'For Executives',
      description: 'Executive transition infrastructure and role-lane guidance.',
    }
  }

  const config = LANE_CONFIG[laneKey]
  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      url: `https://startingmonday.app/for-executives/${laneKey}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: `https://startingmonday.app/for-executives/${laneKey}`,
    },
  }
}

export default async function ExecutiveLanePage(
  { params }: { params: Promise<{ lane: string }> },
) {
  const { lane } = await params
  const laneKey = normalizeLane(lane)
  if (!laneKey) notFound()

  const config = LANE_CONFIG[laneKey]
  const roleFamily = laneToRoleFamily(laneKey)
  const tutorials = getPublicRoleLaneTutorials(roleFamily)
  const inAppTutorials = getRoleLaneTutorials(roleFamily)

  return (
    <>
        <h1 className="sr-only">Starting Monday</h1>
      <LandingPage
        hero={config.hero}
        situations={config.situations}
        faqs={config.faqs}
        proofHighlights={config.proofHighlights}
        sourcePage={`/for-executives/${laneKey}`}
        experimentVariant="control"
      />

      <section className="bg-background px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-card/55 p-5 shadow-xl sm:p-6">
          <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.14em] text-primary">Lane curriculum set</p>
          <h2 className="text-[22px] font-bold leading-snug text-foreground">Lane curriculum: focused guide, article, and chat coach prompt</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">
            Start with one fast article, one focused guide, and one guided chat sequence tailored to this role lane.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tutorials.map((asset) => (
              <article key={asset.title} className="rounded-2xl border border-border bg-muted/[0.05] p-4">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground">{tutorialFormatLabel(asset)}</p>
                <p className="mt-2 text-[13px] font-semibold text-foreground">{asset.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground">{asset.description}</p>
                <Link
                  href={asset.href}
                  className="mt-3 inline-flex items-center rounded bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {asset.ctaLabel}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-foreground mb-2">Trust and source note</p>
            <p className="text-[13px] leading-relaxed text-foreground">
              Lane tutorials are role-specific guidance assets. They do not guarantee interview outcomes and should be used with your own judgment.
              Source path: in-product lane tutorial set ({inAppTutorials.length} assets) plus method controls.
            </p>
            <p className="mt-2 text-[13px] text-foreground">
              <Link href="/evidence-hub#behavior-change" className="underline underline-offset-2 hover:text-foreground">Evidence Hub</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

