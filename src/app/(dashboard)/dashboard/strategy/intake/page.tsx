import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { TagInput } from '@/app/(dashboard)/dashboard/_components/TagInput'
import { saveStrategyIntake } from './actions'
import {
  type SearchIntake,
  TRANSITION_TYPE_OPTIONS,
  SEARCH_STAGE_OPTIONS,
  URGENCY_OPTIONS,
  transitionTypeFromEmploymentStatus,
  urgencyFromSearchTimeline,
} from '@/lib/search-intake'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
const fieldClass = 'w-full rounded-xl border-border bg-background/60 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40'
const labelClass = 'mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground'

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
    <div className="relative min-h-screen bg-background text-foreground">

      <header className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <Button
              variant={audience === 'individual' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-full"
              render={<Link href="/dashboard/strategy/intake?audience=individual" />}
            >
              Individual
            </Button>
            <Button
              variant={audience === 'partner' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-full"
              render={<Link href="/dashboard/strategy/intake?audience=partner" />}
            >
              Partner
            </Button>
            <span className="text-muted-foreground">/</span>
            <Link href="/demo/search-strategy-intake" className="hover:text-foreground transition-colors">Preview</Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/coaches-guide" className="hover:text-foreground transition-colors">Coach guide</Link>
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
          <Card variant="glass" className="p-6 shadow-2xl shadow-muted/20 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Authenticated workflow</p>
                <h1 className="mt-2 font-serif text-[2.3rem] leading-[1.04] tracking-tight text-foreground sm:text-[3rem]">
                  Search strategy intake
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                  Complete the six required fields first. Optional fields add context, but they should not get in the way of the first pass.
                </p>
              </div>
              <Card variant="glass" className="border-border bg-background/65 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Start here</p>
                <ol className="mt-2 space-y-1.5 max-w-72 list-decimal pl-4 text-foreground">
                  <li>Pick the mode that matches the workflow.</li>
                  <li>Fill the required fields in the form below.
                  </li>
                  <li>Use optional fields only when they change the decision.</li>
                </ol>
                <p className="mt-3 max-w-64 text-muted-foreground">
                  {audience === 'partner'
                    ? 'Partner mode adds coach notes and handoff context for a shared review.'
                    : 'Individual mode is for the candidate completing the search alone.'}
                </p>
              </Card>
            </div>

            {saved && (
              <Alert variant="success" className="mt-6">
                <AlertDescription>
                  Intake saved. Your strategy brief, prep briefs, and outreach drafts now use these decision rules.
                </AlertDescription>
              </Alert>
            )}

            {saveError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>Save failed: {decodeURIComponent(saveError)}</AlertDescription>
              </Alert>
            )}

            <form action={saveStrategyIntake} className="mt-8 space-y-8">
              <input type="hidden" name="audience" value={audience} />

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Search frame</p>
                  <h2 className="mt-1 text-[20px] font-bold text-foreground">What this search is aiming at</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className={labelClass} htmlFor="target_titles">Target roles <span className="text-primary">required</span></Label>
                    <TagInput id="target_titles" name="target_titles" required defaultValue={joinTags(profile?.target_titles)} placeholder="CIO, VP of Technology, CTO..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="roles_to_avoid">Roles to avoid <span className="text-muted-foreground">optional</span></Label>
                    <TagInput id="roles_to_avoid" name="roles_to_avoid" defaultValue={joinTags(intake.roles_to_avoid)} placeholder="Consulting, IC roles, non-technical leadership..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="transition_type">Transition type <span className="text-primary">required</span></Label>
                    <Select name="transition_type" required defaultValue={transitionDefault || undefined}>
                      <SelectTrigger id="transition_type" className={`${fieldClass} justify-between`}>
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSITION_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="search_stage">Search stage <span className="text-primary">required</span></Label>
                    <Select name="search_stage" required defaultValue={intake.search_stage || undefined}>
                      <SelectTrigger id="search_stage" className={`${fieldClass} justify-between`}>
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEARCH_STAGE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="urgency">Urgency / timing <span className="text-muted-foreground">optional</span></Label>
                    <Select name="urgency" defaultValue={urgencyDefault || '__none__'}>
                      <SelectTrigger id="urgency" className={`${fieldClass} justify-between`}>
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select one</SelectItem>
                        {URGENCY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="search_hypothesis">Search hypothesis <span className="text-muted-foreground">optional</span></Label>
                    <Input id="search_hypothesis" name="search_hypothesis" defaultValue={intake.search_hypothesis ?? ''} placeholder="Operator for infrastructure modernization..." className={fieldClass} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Target market</p>
                  <h2 className="mt-1 text-[20px] font-bold text-foreground">Where this search should land</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className={labelClass} htmlFor="target_sectors">Target industries <span className="text-primary">required</span></Label>
                    <TagInput id="target_sectors" name="target_sectors" required defaultValue={joinTags(profile?.target_sectors)} placeholder="Health tech, fintech, enterprise SaaS..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="target_locations">Target locations <span className="text-muted-foreground">optional</span></Label>
                    <TagInput id="target_locations" name="target_locations" defaultValue={joinTags(profile?.target_locations)} placeholder="Boston, Remote, New York..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="target_companies">Target companies <span className="text-muted-foreground">optional</span></Label>
                    <TagInput id="target_companies" name="target_companies" defaultValue={joinTags(targetCompaniesDefault)} placeholder="Arcadia, Cotiviti, Kyruus..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="company_size_stage">Company size / stage <span className="text-muted-foreground">optional</span></Label>
                    <Input id="company_size_stage" name="company_size_stage" defaultValue={intake.company_size_stage ?? ''} placeholder="Mid-market, enterprise, PE-backed..." className={fieldClass} />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="intake_geography">Geography <span className="text-muted-foreground">optional</span></Label>
                    <Input id="intake_geography" name="intake_geography" defaultValue={intake.geography ?? ''} placeholder="East Coast, national, local only..." className={fieldClass} />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="remote_travel">Remote / travel constraints <span className="text-muted-foreground">optional</span></Label>
                    <Input id="remote_travel" name="remote_travel" defaultValue={intake.remote_travel ?? ''} placeholder="Remote first, 25% travel max..." className={fieldClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className={labelClass} htmlFor="comp_guardrails">Compensation guardrails <span className="text-muted-foreground">optional</span></Label>
                    <Textarea id="comp_guardrails" name="comp_guardrails" defaultValue={intake.comp_guardrails ?? ''} placeholder="Include only if the candidate wants to constrain salary or equity targets." className={`min-h-24 rounded-2xl ${fieldClass}`} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Positioning</p>
                  <h2 className="mt-1 text-[20px] font-bold text-foreground">What the search should say about the candidate</h2>
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Name, title, and company come from your <Link href="/dashboard/profile" className="text-muted-foreground underline decoration-muted-foreground underline-offset-4 hover:text-foreground">profile</Link>; edit them there.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className={labelClass} htmlFor="positioning_summary">Positioning summary <span className="text-primary">required</span></Label>
                    <Textarea id="positioning_summary" name="positioning_summary" required defaultValue={profile?.positioning_summary ?? ''} placeholder="Operator for infrastructure modernization and executive transformation roles." className={`min-h-28 rounded-2xl ${fieldClass}`} />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="relationship_targets">Relationships to activate <span className="text-muted-foreground">optional</span></Label>
                    <TagInput id="relationship_targets" name="relationship_targets" defaultValue={joinTags(intake.relationship_targets)} placeholder="Former colleagues, board members, search firm contacts..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="culture_criteria">Culture criteria <span className="text-muted-foreground">optional</span></Label>
                    <Input id="culture_criteria" name="culture_criteria" defaultValue={intake.culture_criteria ?? ''} placeholder="Fast-moving, low-ego, execution-focused..." className={fieldClass} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Decision rules</p>
                  <h2 className="mt-1 text-[20px] font-bold text-foreground">How to know a role is a fit</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className={labelClass} htmlFor="decision_criteria">Decision criteria <span className="text-primary">required</span></Label>
                    <TagInput id="decision_criteria" name="decision_criteria" required defaultValue={joinTags(intake.decision_criteria)} placeholder="Mandate quality, sponsor depth, decision clarity..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="red_flags">Red flags <span className="text-muted-foreground">optional</span></Label>
                    <TagInput id="red_flags" name="red_flags" defaultValue={joinTags(intake.red_flags)} placeholder="Unclear mandate, weak sponsor, unrealistic timeline..." />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="board_visibility">Board visibility <span className="text-muted-foreground">optional</span></Label>
                    <Input id="board_visibility" name="board_visibility" defaultValue={intake.board_visibility ?? ''} placeholder="Board-facing, sponsor-led, no board exposure..." className={fieldClass} />
                  </div>
                  <div>
                    <Label className={labelClass} htmlFor="stakeholder_complexity">Stakeholder complexity <span className="text-muted-foreground">optional</span></Label>
                    <Input id="stakeholder_complexity" name="stakeholder_complexity" defaultValue={intake.stakeholder_complexity ?? ''} placeholder="CEO + board + private equity..." className={fieldClass} />
                  </div>
                </div>
              </section>

              {audience === 'partner' && (
                <section className="space-y-4 rounded-3xl border border-primary/20 bg-primary/6 p-5">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Partner mode</p>
                    <h2 className="mt-1 text-[20px] font-bold text-foreground">Coach review and handoff</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className={labelClass} htmlFor="coach_name">Coach or partner name <span className="text-muted-foreground">optional</span></Label>
                      <Input id="coach_name" name="coach_name" defaultValue={intake.coach_name ?? ''} placeholder="Thomas Garland" className={fieldClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className={labelClass} htmlFor="partner_notes">Partner notes <span className="text-muted-foreground">optional</span></Label>
                      <Textarea id="partner_notes" name="partner_notes" defaultValue={intake.partner_notes ?? ''} placeholder="Coach observations, referral context, or follow-up priorities." className={`min-h-24 rounded-2xl ${fieldClass}`} />
                    </div>
                  </div>
                </section>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" className="rounded-full">
                  Save intake
                </Button>
                <Button variant="outline" size="lg" className="rounded-full" render={<Link href="/dashboard/strategy" />}>
                  Back to strategy brief
                </Button>
                <Link href="/demo/search-strategy-intake" className="text-[14px] text-muted-foreground underline decoration-muted-foreground underline-offset-4 hover:text-foreground">
                  Open preview version
                </Link>
              </div>
            </form>
          </Card>

          <Card variant="glass" className="space-y-4 lg:sticky lg:top-24 self-start bg-card/80 p-6 shadow-2xl shadow-muted/20 sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Completion rules</p>
            <h2 className="font-serif text-[2rem] leading-tight text-foreground">What to finish first.</h2>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              This page captures the search frame cleanly. Required fields are enforced, optional fields can wait, and partner mode simply adds handoff context.
            </p>

            <div className="space-y-3">
              {[
                'Required: target roles, transition type, search stage, target industries, positioning summary, decision criteria.',
                'Optional: target companies, geography, comp guardrails, red flags, board visibility, stakeholder complexity, partner notes.',
                'Answers from onboarding are pre-filled where they overlap; adjust anything that has changed.',
              ].map(item => (
                <Card key={item} variant="glass" className="px-4 py-3 text-[13px] leading-relaxed text-foreground">
                  {item}
                </Card>
              ))}
            </div>

            <Card variant="glass" className="border-primary/20 bg-primary/8 p-4 text-[13px] leading-relaxed text-foreground">
              <p className="font-semibold text-primary">Current saved profile</p>
              <p className="mt-2">{profile?.full_name ?? 'No name set'} · {profile?.current_title ?? 'No current title set'}</p>
              <p className="mt-1 text-muted-foreground">{joinTags(profile?.target_titles)}{profile?.target_titles?.length ? '' : 'No target roles yet'}</p>
            </Card>
          </Card>
        </div>
      </main>
    </div>
  )
}
