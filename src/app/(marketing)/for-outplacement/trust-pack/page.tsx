import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Trust and Governance Pack | Starting Monday',
  description: 'Trust, security, data governance, and procurement readiness overview for outplacement and transition partners.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/trust-pack' },
}

const TRUST_PILLARS = [
  {
    title: 'Data ownership and control',
    detail: 'Partner programs and participants retain control of their data access model. Permissions can be scoped and adjusted based on program policy.',
  },
  {
    title: 'Permission-based visibility',
    detail: 'Counselor and program visibility follows the permission model. The goal is support and intervention clarity, not unrestricted access.',
  },
  {
    title: 'Audit visibility',
    detail: 'Program workflows are designed to support transparent activity records for pilot governance and internal review.',
  },
]

const PROCUREMENT_CHECKLIST = [
  'Data ownership and usage terms',
  'Participant permission model',
  'Access logging and review process',
  'Retention and deletion handling',
  'Pilot legal scope and expansion decision gate',
  'Security and incident response review path',
]

const REVIEW_TIMELINE = [
  {
    phase: 'Day 0-2',
    detail: 'Initial fit call, partner scope definition, and trust pack handoff.',
  },
  {
    phase: 'Day 3-7',
    detail: 'Security and legal review track starts in parallel with pilot planning.',
  },
  {
    phase: 'Day 8-10',
    detail: 'Pilot kickoff with scorecard baseline and implementation cadence confirmed.',
  },
]

const LEGAL_BOUNDARIES = [
  {
    topic: 'Role boundaries',
    detail: 'Partner organizations define participant program policy, access approval scope, and reporting recipients; Starting Monday provides the application layer and operational workflow tooling under agreed service terms.',
  },
  {
    topic: 'Data handling boundary',
    detail: 'Data shared into the platform is used only for agreed workflow and reporting outputs. Export, retention, and deletion are governed by contractual scope and partner-approved lifecycle controls.',
  },
  {
    topic: 'Pilot legal scope',
    detail: 'Pilot agreement is scoped to one cohort, one review window, and defined decision gate before any expansion commitment.',
  },
]

const CLAIMS_POLICY = [
  'Board-safe rule 1: report observed cohort outcomes and disclose measurement window.',
  'Board-safe rule 2: do not claim guaranteed placement outcomes from pilot directional metrics.',
  'Board-safe rule 3: distinguish partner-observed outcomes from external benchmarks.',
]

const KPI_STAGES = [
  {
    stage: 'Day 30',
    focus: 'Adoption and operating momentum',
    metrics: 'Activation rate, signal-driven actions, prep-brief usage, stall index.',
  },
  {
    stage: 'Day 60',
    focus: 'Workflow stabilization and counselor yield',
    metrics: 'Session strategy-time ratio, intervention completion rate, recurring readiness patterns.',
  },
  {
    stage: 'Day 90',
    focus: 'Scale-readiness and employer reporting quality',
    metrics: 'Cohort consistency, governance reliability, and decision-grade reporting completeness.',
  },
]

const TRUST_ARTIFACT_INDEX = [
  'Methodology and claim-discipline mini-spec',
  'Pilot scorecard definition sheet and decision memo template',
  'Weekly review packet template with metric definitions',
  'Legal and procurement brief with role/data boundaries',
]

const ATTESTATION_INDEX = [
  {
    item: 'Security overview and trust controls summary',
    availability: 'Public',
  },
  {
    item: 'Detailed controls mapping and governance packet',
    availability: 'Available for partner diligence under request process',
  },
  {
    item: 'Operational incident-response governance summary',
    availability: 'Available for partner diligence under request process',
  },
]

const REGULATED_INDUSTRY_GUIDANCE = [
  'Apply minimum-necessary visibility for high-sensitivity participant cohorts.',
  'Use documented claims policy and staged KPI reporting for governance committees.',
  'Map legal/security reviewers at kickoff and schedule explicit review checkpoints.',
]

const ARTIFACT_MAINTENANCE = [
  {
    artifact: 'Metric dictionary',
    cadence: 'Monthly or on governance change',
    owner: 'Program analytics owner',
  },
  {
    artifact: 'Operating scorecard template',
    cadence: 'Quarterly',
    owner: 'Program lead',
  },
]

const CONSOLIDATED_ARTIFACT_INDEX = [
  {
    artifact: 'Metric dictionary',
    owner: 'Program analytics owner',
    refreshCadence: 'Monthly or on governance change',
    contractMap: 'Pilot acceptance criteria and reporting definitions schedule',
    clauseId: 'Schedule C-1 (proposed)',
  },
  {
    artifact: 'Operating scorecard template',
    owner: 'Program lead',
    refreshCadence: 'Quarterly',
    contractMap: 'Pilot decision gate and expansion criteria schedule',
    clauseId: 'Schedule A-1 (proposed)',
  },
  {
    artifact: 'Trust and controls summary',
    owner: 'Partner success + security owner',
    refreshCadence: 'Quarterly or after major control updates',
    contractMap: 'Security exhibit and diligence support schedule',
    clauseId: 'Schedule D-1 (proposed)',
  },
]

const SLA_ATTESTATION_MAP = [
  {
    domain: 'Support SLA',
    clauseId: 'Schedule B-2 (proposed)',
    requirement: 'Severity-tier response commitments written in commercial schedule',
    evidence: 'Order Form schedule with P1/P2/P3 commitments and escalation contacts',
  },
  {
    domain: 'Security diligence',
    clauseId: 'Schedule D-1 (proposed)',
    requirement: 'Evidence path for security and governance controls',
    evidence: 'Public security summary plus diligence packet under trust artifact request process',
  },
  {
    domain: 'Data handling',
    clauseId: 'MSA Section 4.3 (proposed)',
    requirement: 'Contract-defined data scope, retention, and deletion boundaries',
    evidence: 'Legal boundary section + contractual lifecycle controls language',
  },
]

export default function OutplacementTrustPackPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/for-outplacement" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Back to outplacement page
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
<header className="mb-12">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
            Trust and governance
          </p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Procurement-ready trust pack for partner teams.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
            Summary for outplacement, legal, and procurement teams reviewing pilot launch.
          </p>
        </header>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Trust pillars
          </h2>
          <div className="space-y-3">
            {TRUST_PILLARS.map((item) => (
              <div key={item.title} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{item.title}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Procurement and legal checklist
          </h2>
          <ul className="space-y-2">
            {PROCUREMENT_CHECKLIST.map((item) => (
              <li key={item} className="text-[14px] text-slate-700 leading-relaxed">- {item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Consolidated trust artifact index (owner + refresh cadence)
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Artifact</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Refresh cadence</th>
                  <th className="px-4 py-3 font-semibold">Contract map</th>
                  <th className="px-4 py-3 font-semibold">Clause ID</th>
                </tr>
              </thead>
              <tbody>
                {CONSOLIDATED_ARTIFACT_INDEX.map((row) => (
                  <tr key={row.artifact} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3 text-slate-900 font-medium">{row.artifact}</td>
                    <td className="px-4 py-3 text-slate-700">{row.owner}</td>
                    <td className="px-4 py-3 text-slate-600">{row.refreshCadence}</td>
                    <td className="px-4 py-3 text-slate-600">{row.contractMap}</td>
                    <td className="px-4 py-3 text-slate-600">{row.clauseId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">
            Clause IDs are proposed placeholders and should be swapped for final legal numbering once template schedules are finalized.
          </p>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Legal boundary summary
          </h2>
          <div className="space-y-3">
            {LEGAL_BOUNDARIES.map((row) => (
              <div key={row.topic} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.topic}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            SLA and attestation clause mapping
          </h2>
          <div className="space-y-3">
            {SLA_ATTESTATION_MAP.map((row) => (
              <div key={row.domain} className="border border-slate-200 rounded-lg p-4 bg-white">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.domain}</p>
                <p className="text-[13px] text-slate-600 mb-1"><span className="font-semibold text-slate-700">Clause ID: </span>{row.clauseId}</p>
                <p className="text-[13px] text-slate-600 mb-1"><span className="font-semibold text-slate-700">Requirement: </span>{row.requirement}</p>
                <p className="text-[13px] text-slate-600"><span className="font-semibold text-slate-700">Evidence: </span>{row.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Lightweight authority badges and attestation index
          </h2>
          <div className="space-y-3">
            {ATTESTATION_INDEX.map((row) => (
              <div key={row.item} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.item}</p>
                <p className="text-[12px] text-slate-600">{row.availability}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Confidentiality by design
          </h2>
          <p className="text-[14px] text-slate-700 leading-relaxed">
            Sensitive transitions require minimum-necessary visibility, explicit permission scopes, and traceable access patterns. Partner and counselor views should align to program need, not blanket visibility, especially for regulated or high-profile cohorts.
          </p>
          <div className="mt-4">
            {REGULATED_INDUSTRY_GUIDANCE.map((line) => (
              <p key={line} className="text-[13px] text-slate-700 leading-relaxed">+ {line}</p>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Board-safe claims policy
          </h2>
          <ul className="space-y-2">
            {CLAIMS_POLICY.map((item) => (
              <li key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Staged KPI model (30/60/90)
          </h2>
          <div className="space-y-3">
            {KPI_STAGES.map((row) => (
              <div key={row.stage} className="border border-slate-200 rounded-lg p-4 bg-white">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.stage}: {row.focus}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{row.metrics}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Trust artifact index and request flow
          </h2>
          <ul className="space-y-2">
            {TRUST_ARTIFACT_INDEX.map((item) => (
              <li key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</li>
            ))}
          </ul>
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">
            Request flow: submit partner inquiry, receive artifact index, map requested materials to legal/security owners, and schedule review checkpoint.
          </p>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Artifact maintenance ownership
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Artifact</th>
                  <th className="px-4 py-3 font-semibold">Update cadence</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {ARTIFACT_MAINTENANCE.map((row) => (
                  <tr key={row.artifact} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3 text-slate-900 font-medium">{row.artifact}</td>
                    <td className="px-4 py-3 text-slate-600">{row.cadence}</td>
                    <td className="px-4 py-3 text-slate-700">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Pilot review timeline
          </h2>
          <div className="space-y-3">
            {REVIEW_TIMELINE.map((row) => (
              <div key={row.phase} className="border border-slate-200 rounded-lg p-4 bg-white">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.phase}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">
            Next step
          </h2>
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/50 mb-5">
            <p className="text-[12px] font-semibold text-slate-900 mb-1">Short objection response</p>
            <p className="text-[12px] text-slate-700 leading-relaxed">Concerned this expands governance burden? The trust pack is designed to reduce uncertainty with explicit artifacts and clear decision gates.</p>
          </div>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-5">
            If this trust model fits your standards, move to pilot planning and set explicit pass/fail criteria before kickoff.
          </p>
          <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
            Governance path: review the shared <Link href="/security" className="underline underline-offset-2 hover:text-slate-900 transition-colors">security overview</Link> and <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-900 transition-colors">privacy policy</Link> first, then use this pack for partner-specific procurement, claims, and pilot-governance review.
          </p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/security" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open shared security overview
            </Link>
            <Link href="/partners#apply" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Apply to partner program
            </Link>
            <Link href="/for-outplacement/executive-summary" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              View committee one-pager
            </Link>
            <Link href="/for-outplacement/metric-dictionary" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open canonical metric dictionary
            </Link>
            <Link href="/for-outplacement/operating-scorecard" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open printable operating scorecard
            </Link>
            <Link href="/for-outplacement/economics" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              View outplacement economics
            </Link>
            <Link href="/for-outplacement/faq" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Read outplacement FAQ
            </Link>
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed mt-4">
            Day-30 pause path: if committee evidence is mixed, pause expansion, run one corrective cycle, and reconvene at day 60 with unchanged metric definitions.
          </p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

