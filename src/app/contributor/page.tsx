import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

const REPO = 'https://github.com/richrothschild/startingmonday/blob/main'

const SECTIONS = [
  {
    label: 'Start Here',
    docs: [
      {
        title: '01 - Claude Code Setup',
        description: 'Install Claude Code, authenticate, connect to all services (Railway, Supabase, Resend, Sentry, Anthropic Console). Meeting cadence checklist.',
        href: `${REPO}/docs/onboarding/01-claude-code-setup.md`,
      },
      {
        title: '02 - Environment Setup',
        description: 'Clone the repo, install dependencies, configure .env.local and worker/.env. Full variable reference for web app and worker.',
        href: `${REPO}/docs/onboarding/02-environment-setup.md`,
      },
      {
        title: '03 - Project Overview',
        description: 'What Starting Monday is, who the user is, the six activation actions, current state, and what Rich is focused on.',
        href: `${REPO}/docs/onboarding/03-project-overview.md`,
      },
    ],
  },
  {
    label: 'The Codebase',
    docs: [
      {
        title: '04 - Codebase Guide',
        description: 'Repository structure, Supabase client rules, auth enforcement, API patterns, AI calls, feature gating, migrations, worker job list.',
        href: `${REPO}/docs/onboarding/04-codebase-guide.md`,
      },
      {
        title: '05 - Dev Workflow',
        description: 'Branch strategy, staging environment, commit style, PR process, who owns what, pre-merge checklist, hotfix procedure.',
        href: `${REPO}/docs/onboarding/05-dev-workflow.md`,
      },
      {
        title: 'Architecture',
        description: 'System topology, data model, auth/billing, AI integration, worker jobs and schedules, security posture, key files.',
        href: `${REPO}/docs/architecture.md`,
      },
      {
        title: 'Tech Debt - Round 2',
        description: '7 open items from the May 2026 scan: Sentry gaps in 8 routes, unauthenticated notify endpoint, stale type casts in cron and dashboard pages, Stripe SDK workarounds.',
        href: `${REPO}/docs/tech-debt-round2.md`,
      },
      {
        title: 'Security Audit Runbook',
        description: 'Reusable 5-area security checklist: API surface, Supabase RLS, AI prompt security, third-party integrations, headers and infrastructure. Includes grep commands, risk scoring, and findings tracker.',
        href: `${REPO}/docs/security-audit-runbook.md`,
      },
    ],
  },
  {
    label: 'Product Intelligence',
    docs: [
      {
        title: '06 - Product Intelligence',
        description: 'The intelligence scanner (signal sources, roadmap, known gaps), the synthetic council (how to use it), and the 9 arc personas (onboarding paths, stall detection).',
        href: `${REPO}/docs/onboarding/06-product-intelligence.md`,
      },
      {
        title: 'Intelligence Roadmap',
        description: 'Full detail on the 8 intelligence epics (E1-E8): EDGAR foundation, executive history database, historical backfill, pattern fingerprinting, relationship graph.',
        href: `${REPO}/docs/intelligence-roadmap.md`,
      },
      {
        title: 'Council Review Process',
        description: 'How to run a synthetic council review on any content, architecture decision, or feature. Prompt templates for content and technical reviews.',
        href: `${REPO}/docs/content/council-review-process.md`,
      },
      {
        title: 'Site Review - May 2026',
        description: 'Full synthetic council review of the live site. Every council member, current grade, specific feedback, and exactly what it takes to earn an A. 30+ members across 15 councils.',
        href: `${REPO}/docs/content/site-review-may-2026.md`,
      },
    ],
  },
  {
    label: 'Product Strategy',
    docs: [
      {
        title: 'Persona Friction Analysis',
        description: 'Honest assessment of the 8 personas (CIO, CTO, CISO, CDO, CPO, COO, VP, CDO-Digital): search dynamics, friction points, critical failure modes, win conditions.',
        href: `${REPO}/docs/business/persona-friction-analysis.md`,
      },
      {
        title: 'Persona Quality Roadmap',
        description: 'Six product quality sprints (PQ1-PQ6) that take the platform from D+ to B+ by end of Q2 2026. PQ1 and PQ2 complete.',
        href: `${REPO}/docs/business/persona-quality-roadmap.md`,
      },
      {
        title: 'Product Roadmap',
        description: 'Phase 1-3 feature roadmap with sprint priorities and acceptance criteria.',
        href: `${REPO}/docs/product-roadmap.md`,
      },
    ],
  },
  {
    label: 'Legal & Admin',
    docs: [
      {
        title: '07 - Contributor Agreement',
        description: 'NDA, IP assignment, data access obligations, scope of engagement. Sign and return to Rich before writing any code.',
        href: `${REPO}/docs/onboarding/07-contributor-agreement.md`,
      },
      {
        title: '08 - Day One Checklist',
        description: 'Structured walkthrough of every product surface: signup, pipeline, contacts, signals, chat, briefing, billing, mobile. Bug and UX issue filing format.',
        href: `${REPO}/docs/onboarding/08-day-one-checklist.md`,
      },
    ],
  },
]

export const metadata = { title: 'Contributor Hub - Starting Monday' }

export default async function ContributorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-foreground">
            <span className="text-foreground">Starting </span>
            <span className="text-primary">Monday</span>
            <span className="text-muted-foreground ml-3">&middot; Contributor Hub</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground">Welcome, Chris</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Everything you need to get set up, understand the product, and start building.
            Read in order top to bottom on your first day.
          </p>
        </div>

        <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ['8 docs', 'Core onboarding path before first code change'],
            ['2 days', 'Target time to finish setup, walkthrough, and first environment check'],
            ['1 source of truth', 'Architecture, onboarding, and security runbooks live together here'],
          ].map(([value, label]) => (
            <div key={value} className="rounded-xl border border-border bg-card p-4">
              <p className="text-[24px] font-bold text-foreground mb-1">{value}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{label}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-xl border border-success/30 bg-success/50 p-5">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-success mb-2">Operating note</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
            This hub includes internal architecture, security, workflow, and contributor materials. Keep it inside the contributor circle and use the linked documentation as the verified source before making changes.
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Outcome target: reach first local run, first authenticated walkthrough, and first safe production-ready commit without reconstructing setup from Slack or memory.
          </p>
        </section>

        <div className="space-y-8">
          {SECTIONS.map(section => (
            <section key={section.label} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">
                {section.label}
              </h2>
              <div className="rounded overflow-hidden divide-y divide-border border border-border">
                {section.docs.map(doc => (
                  <a
                    key={doc.href}
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-4 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[13px] font-semibold text-foreground group-hover:text-muted-foreground mb-0.5">
                          {doc.title}
                        </p>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                          {doc.description}
                        </p>
                      </div>
                      <span className="text-[13px] text-muted-foreground shrink-0 mt-0.5">
                        &rarr;
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="dark mt-10 bg-background rounded p-5">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">
            Quick reference
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              ['Repo', 'github.com/richrothschild/startingmonday'],
              ['Production', 'startingmonday.app'],
              ['Staging', 'staging.startingmonday.app'],
              ['Weekly sync', 'Tuesday 8am PT'],
              ['Commit rule', 'Push to main = live immediately'],
              ['Pre-commit', 'tsc + em-dash check (auto-runs)'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-[13px] text-muted-foreground shrink-0">{label}</span>
                <span className="text-[13px] font-mono text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
