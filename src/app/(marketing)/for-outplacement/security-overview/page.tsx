import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Security Overview | Starting Monday',
  description: 'Public security overview for outplacement and transition partners: controls, governance, and trust posture without exposing sensitive implementation details.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/security-overview' },
}

const SECURITY_PRINCIPLES = [
  'Least-privilege access and role-based visibility.',
  'Defense-in-depth controls across application and data layers.',
  'Auditability for partner governance and review workflows.',
  'Secure-by-default product decisions for sensitive transition data.',
]

const INCLUDED_TOPICS = [
  'Access-control model and permission boundaries',
  'Encryption in transit and at rest posture',
  'Logging and audit visibility approach',
  'Incident-response governance model',
  'Partner trust artifact request process',
]

const EXCLUDED_DETAILS = [
  'Infrastructure topology diagrams',
  'Internal network addressing or service inventory',
  'Detection signatures and alert thresholds',
  'Vulnerability disclosure implementation specifics',
  'Internal credentialing and key-management procedures',
]

const OPERATING_AREAS = [
  {
    title: 'Access control and identity',
    detail: 'Partner and counselor visibility follows a permission-based model aligned to role and program scope. Access is designed to be reviewable and revocable.',
  },
  {
    title: 'Data protection',
    detail: 'Data is protected in transit and at rest using modern encryption standards. Data handling follows partner-defined policy boundaries and agreed contractual scope.',
  },
  {
    title: 'Monitoring and incident governance',
    detail: 'Operational monitoring and incident processes support triage, containment, communication, and post-incident review with partner-facing updates as needed.',
  },
  {
    title: 'Change and vulnerability management',
    detail: 'Security and reliability risks are handled through controlled release practices, remediation tracking, and governance checkpoints tied to partner commitments.',
  },
  {
    title: 'Business continuity and recovery',
    detail: 'Continuity planning focuses on preserving partner workflows and restoring service predictably in the event of disruption.',
  },
]

export default function OutplacementSecurityOverviewPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-outplacement" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to outplacement page
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <header className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">Security overview</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Public security summary for partner evaluation.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
            This document provides meaningful security and governance transparency for partner teams while intentionally excluding sensitive implementation details that could increase risk.
          </p>
        </header>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Security principles</p>
          {SECURITY_PRINCIPLES.map((item) => (
            <p key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</p>
          ))}
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">What this document includes</p>
          {INCLUDED_TOPICS.map((item) => (
            <p key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</p>
          ))}
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3 mt-6">What this document intentionally excludes</p>
          {EXCLUDED_DETAILS.map((item) => (
            <p key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</p>
          ))}
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Operating areas</p>
          <div className="space-y-3">
            {OPERATING_AREAS.map((area) => (
              <div key={area.title} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{area.title}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{area.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Next step</p>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            For deeper diligence, request the trust artifact index through your partner contact and map required documents to your legal and security reviewers.
          </p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/for-outplacement/trust-pack" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open trust and governance pack
            </Link>
            <Link href="/for-outplacement/executive-summary" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              View committee one-pager
            </Link>
            <Link href="/partners#apply" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Contact partner team
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

