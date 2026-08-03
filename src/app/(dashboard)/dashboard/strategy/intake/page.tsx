import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { TagInput } from '@/components/TagInput'
import { saveStrategyIntake } from './actions'
import {
  type SearchIntake,
  TRANSITION_TYPE_OPTIONS,
  SEARCH_STAGE_OPTIONS,
  URGENCY_OPTIONS,
  transitionTypeFromEmploymentStatus,
  urgencyFromSearchTimeline,
} from '@/lib/search-intake'

const selectClass = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white focus:border-orange-400/40 focus:outline-none'

function joinTags(values?: string[] | null) {
  return (values ?? []).join(', ')
}

export const metadata = {
  title: 'Search Strategy Intake - Starting Monday',
}

export default async function StrategyIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; audience?: string }>
}) {
  const { saved, error: saveError, audience: audienceParam } = await searchParams
  const audience: 'individual' | 'partner' = audienceParam === 'partner' ? 'partner' : 'individual'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: pipelineCompanies }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, current_title, current_company, target_titles, target_sectors, target_locations, positioning_summary, role_context, employment_status, search_timeline')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('companies')
      .select('name')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(8),
  ])

  const intake = ((profile?.role_context as Record<string, unknown> | null)?.search_intake as SearchIntake | undefined) ?? {}

  // Option A journey: onboarding answers seed the intake so nothing is asked twice.
  const transitionDefault = intake.transition_type ?? transitionTypeFromEmploymentStatus(profile?.employment_status) ?? ''
  const urgencyDefault = intake.urgency ?? urgencyFromSearchTimeline(profile?.search_timeline) ?? ''
  const targetCompaniesDefault = intake.target_companies?.length
    ? intake.target_companies
    : (pipelineCompanies ?? []).map(c => c.name)

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-300">
            <Link href="/dashboard/strategy/intake?audience=individual" className={`rounded-full px-3 py-1.5 transition-colors ${audience === 'individual' ? 'bg-white/10 text-white' : 'hover:text-white'}`}>
              Individual
            </Link>
            <Link href="/dashboard/strategy/intake?audience=partner" className={`rounded-full px-3 py-1.5 transition-colors ${audience === 'partner' ? 'bg-white/10 text-white' : 'hover:text-white'}`}>
              Partner
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/demo/search-strategy-intake" className="hover:text-white transition-colors">Preview</Link>
            <span className="text-slate-600">/</span>
            <Link href="/coaches-guide" className="hover:text-white transition-colors">Coach guide</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Search Strategy', href: '/dashboard/strategy' },
            { label: 'Intake' },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Authenticated workflow</p>
                <h1 className="mt-2 font-serif text-[2.3rem] leading-[1.04] tracking-tight text-white sm:text-[3rem]">
                  Search strategy intake
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-300">
                  Complete the six required fields first. Optional fields add context, but they should not get in the way of the first pass.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-[13px] leading-relaxed text-slate-300">
                <p className="font-semibold text-white">Start here</p>
                <ol className="mt-2 space-y-1.5 max-w-72 list-decimal pl-4 text-slate-200">
                  <li>Pick the mode that matches the workflow.</li>
                  <li>Fill the required fields in the form below.
                  </li>
                  <li>Use optional fields only when they change the decision.</li>
                </ol>
                <p className="mt-3 max-w-64 text-slate-400">
                  {audience === 'partner'
                    ? 'Partner mode adds coach notes and handoff context for a shared review.'
                    : 'Individual mode is for the candidate completing the search alone.'}
                </p>
              </div>
            </div>

            {saved && (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-100">
                Intake saved. Your strategy brief, prep briefs, and outreach drafts now use these decision rules.
              </div>
            )}

            {saveError && (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-100">
                Save failed: {decodeURIComponent(saveError)}
              </div>
            )}

            <form action={saveStrategyIntake} className="mt-8 space-y-8">
              <input type="hidden" name="audience" value={audience} />

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Search frame</p>
                  <h2 className="mt-1 text-[20px] font-bold text-white">What this search is aiming at</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="target_titles">Target roles <span className="text-orange-200">required</span></label>
                    <TagInput id="target_titles" name="target_titles" required defaultValue={joinTags(profile?.target_titles)} placeholder="CIO, VP of Technology, CTO..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="roles_to_avoid">Roles to avoid <span className="text-slate-500">optional</span></label>
                    <TagInput id="roles_to_avoid" name="roles_to_avoid" defaultValue={joinTags(intake.roles_to_avoid)} placeholder="Consulting, IC roles, non-technical leadership..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="transition_type">Transition type <span className="text-orange-200">required</span></label>
                    <select id="transition_type" name="transition_type" required defaultValue={transitionDefault} className={selectClass}>
                      <option value="" disabled>Select one</option>
                      {TRANSITION_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="search_stage">Search stage <span className="text-orange-200">required</span></label>
                    <select id="search_stage" name="search_stage" required defaultValue={intake.search_stage ?? ''} className={selectClass}>
                      <option value="" disabled>Select one</option>
                      {SEARCH_STAGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="urgency">Urgency / timing <span className="text-slate-500">optional</span></label>
                    <select id="urgency" name="urgency" defaultValue={urgencyDefault} className={selectClass}>
                      <option value="">Select one</option>
                      {URGENCY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="search_hypothesis">Search hypothesis <span className="text-slate-500">optional</span></label>
                    <input id="search_hypothesis" name="search_hypothesis" defaultValue={intake.search_hypothesis ?? ''} placeholder="Operator for infrastructure modernization..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Target market</p>
                  <h2 className="mt-1 text-[20px] font-bold text-white">Where this search should land</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="target_sectors">Target industries <span className="text-orange-200">required</span></label>
                    <TagInput id="target_sectors" name="target_sectors" required defaultValue={joinTags(profile?.target_sectors)} placeholder="Health tech, fintech, enterprise SaaS..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="target_locations">Target locations <span className="text-slate-500">optional</span></label>
                    <TagInput id="target_locations" name="target_locations" defaultValue={joinTags(profile?.target_locations)} placeholder="Boston, Remote, New York..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="target_companies">Target companies <span className="text-slate-500">optional</span></label>
                    <TagInput id="target_companies" name="target_companies" defaultValue={joinTags(targetCompaniesDefault)} placeholder="Arcadia, Cotiviti, Kyruus..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="company_size_stage">Company size / stage <span className="text-slate-500">optional</span></label>
                    <input id="company_size_stage" name="company_size_stage" defaultValue={intake.company_size_stage ?? ''} placeholder="Mid-market, enterprise, PE-backed..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="intake_geography">Geography <span className="text-slate-500">optional</span></label>
                    <input id="intake_geography" name="intake_geography" defaultValue={intake.geography ?? ''} placeholder="East Coast, national, local only..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="remote_travel">Remote / travel constraints <span className="text-slate-500">optional</span></label>
                    <input id="remote_travel" name="remote_travel" defaultValue={intake.remote_travel ?? ''} placeholder="Remote first, 25% travel max..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="comp_guardrails">Compensation guardrails <span className="text-slate-500">optional</span></label>
                    <textarea id="comp_guardrails" name="comp_guardrails" defaultValue={intake.comp_guardrails ?? ''} placeholder="Include only if the candidate wants to constrain salary or equity targets." className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Positioning</p>
                  <h2 className="mt-1 text-[20px] font-bold text-white">What the search should say about the candidate</h2>
                </div>
                <p className="text-[13px] leading-relaxed text-slate-400">
                  Name, title, and company come from your <Link href="/dashboard/profile" className="text-slate-200 underline decoration-slate-500 underline-offset-4 hover:text-white">profile</Link>; edit them there.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="positioning_summary">Positioning summary <span className="text-orange-200">required</span></label>
                    <textarea id="positioning_summary" name="positioning_summary" required defaultValue={profile?.positioning_summary ?? ''} placeholder="Operator for infrastructure modernization and executive transformation roles." className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="relationship_targets">Relationships to activate <span className="text-slate-500">optional</span></label>
                    <TagInput id="relationship_targets" name="relationship_targets" defaultValue={joinTags(intake.relationship_targets)} placeholder="Former colleagues, board members, search firm contacts..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="culture_criteria">Culture criteria <span className="text-slate-500">optional</span></label>
                    <input id="culture_criteria" name="culture_criteria" defaultValue={intake.culture_criteria ?? ''} placeholder="Fast-moving, low-ego, execution-focused..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Decision rules</p>
                  <h2 className="mt-1 text-[20px] font-bold text-white">How to know a role is a fit</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="decision_criteria">Decision criteria <span className="text-orange-200">required</span></label>
                    <TagInput id="decision_criteria" name="decision_criteria" required defaultValue={joinTags(intake.decision_criteria)} placeholder="Mandate quality, sponsor depth, decision clarity..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="red_flags">Red flags <span className="text-slate-500">optional</span></label>
                    <TagInput id="red_flags" name="red_flags" defaultValue={joinTags(intake.red_flags)} placeholder="Unclear mandate, weak sponsor, unrealistic timeline..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="board_visibility">Board visibility <span className="text-slate-500">optional</span></label>
                    <input id="board_visibility" name="board_visibility" defaultValue={intake.board_visibility ?? ''} placeholder="Board-facing, sponsor-led, no board exposure..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="stakeholder_complexity">Stakeholder complexity <span className="text-slate-500">optional</span></label>
                    <input id="stakeholder_complexity" name="stakeholder_complexity" defaultValue={intake.stakeholder_complexity ?? ''} placeholder="CEO + board + private equity..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                  </div>
                </div>
              </section>

              {audience === 'partner' && (
                <section className="space-y-4 rounded-3xl border border-orange-400/20 bg-orange-500/6 p-5">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Partner mode</p>
                    <h2 className="mt-1 text-[20px] font-bold text-white">Coach review and handoff</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="coach_name">Coach or partner name <span className="text-slate-500">optional</span></label>
                      <input id="coach_name" name="coach_name" defaultValue={intake.coach_name ?? ''} placeholder="Thomas Garland" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300" htmlFor="partner_notes">Partner notes <span className="text-slate-500">optional</span></label>
                      <textarea id="partner_notes" name="partner_notes" defaultValue={intake.partner_notes ?? ''} placeholder="Coach observations, referral context, or follow-up priorities." className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/40 focus:outline-none" />
                    </div>
                  </div>
                </section>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded-full bg-orange-500 px-6 py-3 text-[14px] font-semibold text-slate-950 transition-colors hover:bg-orange-400">
                  Save intake
                </button>
                <Link href="/dashboard/strategy" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10">
                  Back to strategy brief
                </Link>
                <Link href="/demo/search-strategy-intake" className="text-[14px] text-slate-300 underline decoration-slate-500 underline-offset-4 hover:text-white">
                  Open preview version
                </Link>
              </div>
            </form>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 self-start rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Completion rules</p>
            <h2 className="font-serif text-[2rem] leading-tight text-white">What to finish first.</h2>
            <p className="text-[14px] leading-relaxed text-slate-300">
              This page captures the search frame cleanly. Required fields are enforced, optional fields can wait, and partner mode simply adds handoff context.
            </p>

            <div className="space-y-3">
              {[
                'Required: target roles, transition type, search stage, target industries, positioning summary, decision criteria.',
                'Optional: target companies, geography, comp guardrails, red flags, board visibility, stakeholder complexity, partner notes.',
                'Answers from onboarding are pre-filled where they overlap; adjust anything that has changed.',
              ].map(item => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] leading-relaxed text-slate-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-orange-500/8 p-4 text-[13px] leading-relaxed text-slate-200">
              <p className="font-semibold text-orange-100">Current saved profile</p>
              <p className="mt-2">{profile?.full_name ?? 'No name set'} · {profile?.current_title ?? 'No current title set'}</p>
              <p className="mt-1 text-slate-300">{joinTags(profile?.target_titles)}{profile?.target_titles?.length ? '' : 'No target roles yet'}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}