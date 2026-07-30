import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LIFECYCLE_TEMPLATES, LIFECYCLE_STATE_DESCRIPTIONS } from '@/lib/executive-lifecycle'

export const metadata: Metadata = {
  title: 'Optionality Mode | Starting Monday',
  description: 'Quietly monitor the market, warm key relationships, and stay ready - without signaling departure.',
}

/**
 * Optionality Mode - Sprint ITS-3 Ticket 16
 *
 * AC:
 * - Distinct from active search state
 * - Confidentiality-safe workflow framing
 * - Persona-specific: in-role quiet variant
 * - Subtle external positioning guidance
 * - Accomplishment record and relationship-warmth loop accessible from here
 */
export default async function OptionalityModePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, search_status, positioning_summary')
    .eq('user_id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const template = LIFECYCLE_TEMPLATES.find(
    (t) => t.state === 'optionality' && t.persona === 'in_role_quiet',
  )!

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/dashboard" className="text-[13px] text-slate-300 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Mode header */}
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">
                Optionality Mode - In-Role (Quiet)
              </p>
              <h1 className="text-[26px] font-bold text-slate-900 leading-tight">
                Good to see you, {firstName}.
              </h1>
              <p className="text-[14px] text-slate-500 mt-2 leading-relaxed max-w-xl">
                {LIFECYCLE_STATE_DESCRIPTIONS.optionality}
              </p>
            </div>
            <span className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
              Quiet mode
            </span>
          </div>
        </div>

        {/* Confidentiality notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 px-5 py-4">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-amber-600 mb-2">
            Confidentiality guidance
          </p>
          <p className="text-[13px] text-amber-800 leading-relaxed">
            {template.confidentialityNotes}
          </p>
        </div>

        {/* Subtle external positioning guidance */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 px-5 py-4">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-blue-600 mb-2">
            External positioning - signal-level guidance
          </p>
          <p className="text-[13px] text-blue-800 leading-relaxed">
            {template.positioningGuidance}
          </p>
        </div>

        {/* Weekly focus */}
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[13px] font-bold text-slate-700 mb-3">This week&apos;s focus</h2>
          <ul className="space-y-2">
            {template.weeklyFocus.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13px] text-slate-700">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Session opening prompts */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
          <h2 className="text-[13px] font-bold text-slate-700 mb-3">Coach session opening prompts</h2>
          <ul className="space-y-2">
            {template.sessionOpeningPrompts.map((prompt) => (
              <li key={prompt} className="flex items-start gap-3 text-[13px] text-slate-600 italic">
                <span className="text-slate-400 mt-0.5 not-italic">?</span>
                {prompt}
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation to related tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/optionality/branding', label: 'Branding profile', desc: 'Maintain your narrative thesis and audience variants' },
            { href: '/dashboard/optionality/decision-cockpit', label: 'Decision cockpit', desc: 'Score targets against what matters to you' },
            { href: '/dashboard/post-landing', label: 'Post-landing mode', desc: '30/60/90 day onboarding plan' },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 hover:border-orange-300 transition-colors group"
            >
              <p className="text-[13px] font-semibold text-slate-900 group-hover:text-orange-700 transition-colors">{label}</p>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Switch to active search */}
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Ready to go active?</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Switch to Active when urgency increases.</p>
          </div>
          <Link
            href="/dashboard"
            className="flex-shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-[12px] font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-700 transition-colors"
          >
            Active dashboard →
          </Link>
        </div>
      </main>
    </div>
  )
}
