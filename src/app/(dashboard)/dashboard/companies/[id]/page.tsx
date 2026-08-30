import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { updateCompany, archiveCompany, addFollowUp, markFollowUpDone, addContact, archiveContact, addDocument, removeDocument, reportMissedRole } from './actions'
import { todayInTz } from '@/lib/date'
import { PREVIEW_CHARS } from '@/lib/ai/ai-limits'
import { LogSignalForm } from '@/app/(dashboard)/dashboard/_components/LogSignalForm'
import { ScanPoller } from '@/app/(dashboard)/dashboard/_components/ScanPoller'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
import {
  DOC_LABELS,
  CHANNEL,
  OUTREACH_STATUS,
  STAGES,
  NOTES_PLACEHOLDERS,
  type ScanResult,
  type InterviewLog,
  type SignalDetailRow,
} from './company-detail-constants'
import { JobScanPanel } from './job-scan-panel'
import { SignalsPanel } from './signals-panel'
import { InterviewSessionsPanel } from './interview-sessions-panel'
import { CompanyNextActionBanner } from './company-next-action-banner'
import { ContactsPanel } from './contacts-panel'
import { DocumentsPanel } from './documents-panel'
import { CompanyCompetitiveField } from './company-competitive-field'
import { CompanyFitCard } from './company-fit-card'
import { CompanyOfferFields } from './company-offer-fields'
import { buildCompanyFitSummary } from '../../signal-orientation'

type CompanyDetailRow = {
  id: string
  name: string
  sector: string | null
  stage: string
  company_size: string | null
  fit_score: number | null
  notes: string | null
  competitive_context: string | null
  interview_notes: string | null
  company_url: string | null
  career_page_url: string | null
  linkedin_url: string | null
  crunchbase_id: string | null
  role_watch_description: string | null
  offer_role_title: string | null
  offer_base: number | null
  offer_bonus_pct: number | null
  offer_signing: number | null
  offer_equity: string | null
  offer_notes: string | null
  offer_decision_factors: string | null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { title: 'Company' }
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  return { title: company?.name ?? 'Company' }
}

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string; scanning?: string; stage_up?: string; missed?: string; missed_error?: string }>
}) {
  const { id } = await params
  const { error, saved, scanning, stage_up: stageUp, missed, missed_error: missedError } = await searchParams
  const isScanning = scanning === '1' && true

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: rawCompany, error: companyError } = await supabase
    .from('companies')
    .select('id, name, sector, stage, company_size, fit_score, notes, competitive_context, interview_notes, company_url, career_page_url, linkedin_url, crunchbase_id, role_watch_description, offer_role_title, offer_base, offer_bonus_pct, offer_signing, offer_equity, offer_notes, offer_decision_factors')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('archived_at', null)
    .single()

  const [{ data: followUps }, { data: contacts }, { data: profile }, { data: rawScans }, { data: documents }, { data: rawSignals }, { count: prepBriefCount }, { data: rawInterviewLogs }] = await Promise.all([
    supabase
      .from('follow_ups')
      .select('id, action, due_date, contact_id')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true }),
    supabase
      .from('contacts')
      .select('id, name, title, firm, channel, notes, outreach_status')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    supabase
      .from('user_profiles')
      .select('briefing_timezone, search_persona, target_titles, target_sectors, positioning_summary, role_type')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('scan_results')
      .select('id, scanned_at, status, ai_score, ai_summary, raw_hits, error_message')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(6),
    supabase
      .from('company_documents')
      .select('id, label, content, created_at')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, outreach_angle, outreach_draft, signal_date, source_url')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .gte('signal_date', since90d)
      .order('signal_date', { ascending: false })
      .limit(10),
    supabase
      .from('briefs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', id)
      .eq('user_id', user.id)
      .eq('type', 'prep'),
    supabase
      .from('company_interview_logs')
      .select('id, interview_date, interview_stage, questions_asked, what_landed, what_surprised, follow_up_needed')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .order('interview_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const company = rawCompany
    ? {
        ...(rawCompany as Omit<CompanyDetailRow, 'competitive_context'> & { competitive_context?: string | null }),
        competitive_context: (rawCompany as { competitive_context?: string | null }).competitive_context ?? null,
      } as CompanyDetailRow
    : null
  const signals = (() => {
    const seen = new Set<string>()
    return ((rawSignals ?? []) as unknown as SignalDetailRow[]).filter(s => {
      const key = (s.signal_summary ?? '').trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  })()
  const scans = (rawScans ?? []) as unknown as ScanResult[]
  const latestScan = scans[0] ?? null
  const scanHistory = scans.slice(1)
  const interviewLogs = (rawInterviewLogs ?? []) as unknown as InterviewLog[]

  if (companyError && companyError.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" - that's a real 404; anything else is a schema/query error
    console.error('[company page] query error:', companyError)
    throw new Error(`Failed to load company: ${companyError.message}`)
  }
  if (!company) notFound()

  const fitSummary = buildCompanyFitSummary(
    {
      id: company.id,
      name: company.name,
      sector: company.sector,
      company_size: company.company_size,
      fit_score: company.fit_score,
      notes: company.notes,
      role_watch_description: company.role_watch_description,
    },
    signals,
    profile ?? null,
  )

  const todayISO = todayInTz(profile?.briefing_timezone ?? 'UTC')
  const nextFollowUpByContact = new Map<string, { due_date: string; action: string }>()
  for (const fu of (followUps ?? [])) {
    if (fu.contact_id && !nextFollowUpByContact.has(fu.contact_id)) {
      nextFollowUpByContact.set(fu.contact_id, { due_date: fu.due_date, action: fu.action })
    }
  }

  const notesPlaceholder = (profile?.role_type ? NOTES_PLACEHOLDERS[profile.role_type] : null)
    ?? 'Warm intro through Sarah, strong culture fit...'

  const isVpUser = profile?.search_persona === 'vp'

  const errorMsg =
    error === 'duplicate' ? 'A company with that name is already in your pipeline.' :
    error === 'required'  ? 'Company name is required.' :
    null

  const missedRoleMsg = missed === '1'
    ? 'Thanks. We queued this role URL for verification and backfill.'
    : missedError === 'required'
      ? 'Paste a job URL so we can verify the missed role.'
      : null

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link
            href="/dashboard"
            className="text-[13px] text-muted-foreground transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <ScanPoller active={isScanning && !latestScan} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Company' },
            { label: company.name },
          ]}
        />
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight">{company.name}</h1>
            {company.sector && (
              <p className="text-[13px] text-muted-foreground mt-1.5">{company.sector}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" render={<Link href={`/dashboard/profile/tailor?companyId=${id}`} />}>
              Tailor resume
            </Button>
            <Button variant="outline" render={<Link href={`/dashboard/companies/${id}/prep?stage=informal_meeting`} />}>
              Conversation prep
            </Button>
            <Button variant="outline" render={<Link href={`/dashboard/companies/${id}/prep`} />}>
              Interview prep
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Edit form */}
          <Card variant="glass" id="company-details" className="rounded p-5 sm:p-8">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-5">
              Company details
            </h2>

            <CompanyFitCard fitSummary={fitSummary} />

            {errorMsg && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            {stageUp ? (
              <Alert variant="success" className="mb-5">
                <AlertTitle>
                  {company.name} moved to {
                    stageUp === 'researching'  ? 'Researching' :
                    stageUp === 'applied'       ? 'In Process' :
                    stageUp === 'interviewing'  ? 'Interviewing' :
                    stageUp === 'offer'         ? 'Offer' : stageUp
                  }.
                </AlertTitle>
                <AlertDescription>That is real progress.</AlertDescription>
              </Alert>
            ) : saved ? (
              <Alert variant="success" className="mb-5">
                <AlertDescription>Changes saved.</AlertDescription>
              </Alert>
            ) : null}

            <Card variant="glass" className="mb-5 rounded p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Current snapshot</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-muted-foreground">
                <p><span className="font-semibold text-muted-foreground">Stage:</span> {(STAGES.find((s) => s.value === company.stage)?.label) ?? company.stage}</p>
                <p><span className="font-semibold text-muted-foreground">Fit score:</span> {company.fit_score != null ? `${company.fit_score}/10` : 'Not set'}</p>
                <p><span className="font-semibold text-muted-foreground">Sector:</span> {company.sector ?? 'Not set'}</p>
                <p><span className="font-semibold text-muted-foreground">Size:</span> {company.company_size ?? 'Not set'}</p>
              </div>
            </Card>

            <Collapsible className="border border-border rounded">
              <CollapsibleTrigger className="w-full cursor-pointer px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-foreground">Edit company profile</span>
                <span className="text-[13px] text-muted-foreground">Open fields</span>
              </CollapsibleTrigger>

              <CollapsibleContent>
              <form action={updateCompany.bind(null, id)} className="flex flex-col gap-5 p-4 sm:p-5">

              <div>
                <Label htmlFor="company-name" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Company name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={company.name}
                  className="w-full text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stage" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                    Stage
                  </Label>
                  <Select name="stage" defaultValue={company.stage}>
                    <SelectTrigger id="stage" className="w-full text-foreground bg-muted/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                    Fit score <span className="text-muted-foreground font-normal">(1–10)</span>
                  </Label>
                  <Input
                    name="fit_score"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={company.fit_score ?? ''}
                    placeholder="-"
                    className="w-full text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="mt-1.5 text-[13px] text-muted-foreground">1 = weak fit &middot; 10 = dream company</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                    Sector
                  </Label>
                  <Input
                    name="sector"
                    type="text"
                    defaultValue={company.sector ?? ''}
                    placeholder="e.g. Healthcare, Fintech"
                    className="w-full text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_size" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                    Company size
                  </Label>
                  <Select name="company_size" defaultValue={company.company_size ?? 'unset'}>
                    <SelectTrigger id="edit_company_size" className="w-full text-foreground bg-muted/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Unknown</SelectItem>
                      <SelectItem value="startup">Startup (under 200)</SelectItem>
                      <SelectItem value="midmarket">Mid-Market (200-2,000)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (2,000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Company website
                </Label>
                <Input
                  name="company_url"
                  type="text"
                  defaultValue={company.company_url ?? ''}
                  placeholder="acme.com or https://acme.com"
                  className="w-full text-foreground placeholder:text-muted-foreground"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Main URL - used to discover press room and leadership page</p>
              </div>

              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Career page URL
                </Label>
                <Input
                  name="career_page_url"
                  type="text"
                  defaultValue={company.career_page_url ?? ''}
                  placeholder="acme.com/careers or https://acme.com/careers"
                  className="w-full text-foreground placeholder:text-muted-foreground"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Used in job scans - runs Mon / Wed / Fri</p>
              </div>

              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  LinkedIn company URL
                </Label>
                <Input
                  name="linkedin_url"
                  type="text"
                  defaultValue={company.linkedin_url ?? ''}
                  placeholder="linkedin.com/company/acme"
                  className="w-full text-foreground placeholder:text-muted-foreground"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Used to detect executive hires and departures</p>
              </div>

              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Crunchbase permalink
                </Label>
                <Input
                  name="crunchbase_id"
                  type="text"
                  defaultValue={company.crunchbase_id ?? ''}
                  placeholder="e.g. acme-corp"
                  className="w-full text-foreground placeholder:text-muted-foreground"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Last segment of the Crunchbase URL - crunchbase.com/organization/<span className="font-medium text-muted-foreground">acme-corp</span>. Enables funding round signals.</p>
              </div>

              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Notes
                </Label>
                <Textarea
                  name="notes"
                  rows={4}
                  defaultValue={company.notes ?? ''}
                  placeholder={notesPlaceholder}
                  className="w-full text-foreground placeholder:text-muted-foreground resize-none"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Your notes are private. Only you can read them.</p>
              </div>

              <CompanyCompetitiveField competitiveContext={company.competitive_context} />

              <div className="pt-1 border-t border-border">
                <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-primary mb-2">Interview Notes</p>
                <Textarea
                  name="interview_notes"
                  rows={5}
                  defaultValue={company.interview_notes ?? ''}
                  placeholder={'Add notes after each conversation. What was asked, what landed, what surprised you, who was in the room, what you want to prep differently next time.\n\nSeparate entries by stage or date - e.g. "Recruiter screen 5/7:" then "Hiring manager 5/14:"'}
                  className="w-full text-foreground placeholder:text-muted-foreground resize-y"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Private. Each entry sharpens your next prep brief based on what actually happened.</p>
              </div>

              {company.stage === 'offer' && (
                <CompanyOfferFields company={company} companyName={company.name} />
              )}

              <div className="pt-1 border-t border-border">
                <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-primary mb-2">What I&rsquo;m Looking For Here</p>
                <Textarea
                  name="role_watch_description"
                  rows={3}
                  defaultValue={company.role_watch_description ?? ''}
                  placeholder="e.g. A CTO or VP Engineering role overseeing platform, specifically where they need someone to scale the team post-Series B and modernize the data stack..."
                  className="w-full text-foreground placeholder:text-muted-foreground resize-none"
                />
                <p className="mt-1.5 text-[13px] text-muted-foreground">Used by the job scanner to match roles semantically, not just by keyword. More specific beats generic.</p>
              </div>

              <div>
                <Button type="submit">
                  Save changes
                </Button>
              </div>

              </form>
              </CollapsibleContent>
            </Collapsible>

            <div className="mt-8 pt-6 border-t border-border">
              <form action={archiveCompany.bind(null, id)}>
                <Button type="submit" variant="outline" className="hover:text-destructive hover:border-destructive/30">
                  Archive company
                </Button>
              </form>
            </div>
          </Card>

          {/* Follow-ups sidebar */}
          <div className="flex flex-col gap-4">

            <Collapsible className="bg-muted/40 border border-border rounded overflow-hidden">
              <CollapsibleTrigger className="w-full cursor-pointer px-5 py-4 border-b border-border flex items-center justify-between">
                <span className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Open Actions</span>
                <span className="text-[13px] text-muted-foreground">{(followUps ?? []).length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
              {followUps && followUps.length > 0 ? (
                <div className="divide-y divide-border">
                  {followUps.map(fu => {
                    const isOverdue = fu.due_date < todayISO
                    const isToday = fu.due_date === todayISO
                    const dueLabel = new Date(fu.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const dateLabel = isToday ? 'Due today' : isOverdue ? `Overdue - due ${dueLabel}` : dueLabel
                    // Stored action text can contain frozen relative time ("has been 8
                    // days since intro call") that rots as days pass. Strip it at render.
                    const actionText = fu.action.replace(/\s*(?:--|-)?\s*(?:it\s+)?has been \d+ days? since[^.]*\.?/i, '').trim() || fu.action
                    return (
                      <div key={fu.id} className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold text-foreground mb-1.5">{actionText}</div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[13px] font-semibold ${isOverdue || isToday ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {dateLabel}
                          </span>
                          <form action={markFollowUpDone.bind(null, fu.id, id)}>
                            <Button type="submit" variant="outline" size="sm" className="text-muted-foreground hover:text-foreground">
                              Done
                            </Button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-5 py-6 text-[13px] text-muted-foreground">
                  No open actions.
                </div>
              )}
              </CollapsibleContent>
            </Collapsible>

          </div>
        </div>
        <CompanyNextActionBanner
          contacts={contacts ?? []}
          prepBriefCount={prepBriefCount ?? 0}
          stage={company.stage}
          interviewLogsLength={interviewLogs.length}
          companyName={company.name}
          companyId={id}
        />

        {/* Contacts */}
        <section id="people" className="mt-6 bg-muted/40 border border-border rounded overflow-hidden">
          <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
              People
            </h2>
            <span className="text-[13px] text-muted-foreground">
              {(contacts ?? []).length} {(contacts ?? []).length === 1 ? 'contact' : 'contacts'}
            </span>
          </div>

          <ContactsPanel
            companyId={id}
            contacts={contacts ?? []}
            nextFollowUpByContact={nextFollowUpByContact}
            todayISO={todayISO}
          />
        </section>

        <Accordion className="mt-6 flex flex-col gap-6">

        {/* Documents */}
        <AccordionItem value="documents" id="documents" className="border-b-0 bg-muted/40 border border-border rounded overflow-hidden">
          <AccordionTrigger className="cursor-pointer px-6 py-[18px] border-b border-border flex items-center justify-between hover:no-underline [&>svg]:hidden">
            <div>
              <span className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                Documents
              </span>
              <div className="text-[13px] text-muted-foreground mt-0.5">Job descriptions improve prep-brief quality.</div>
            </div>
            <span className="text-[13px] text-muted-foreground shrink-0">
              {(documents ?? []).length} {(documents ?? []).length === 1 ? 'document' : 'documents'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <DocumentsPanel companyId={id} documents={documents ?? []} previewChars={PREVIEW_CHARS} />
          </AccordionContent>
        </AccordionItem>

        {/* Scan results */}
        <AccordionItem value="job-scan" id="job-scan" className="border-b-0 bg-muted/40 border border-border rounded overflow-hidden">
          <AccordionTrigger className="cursor-pointer px-6 py-[18px] border-b border-border flex items-center justify-between hover:no-underline [&>svg]:hidden">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
              Job Scan
            </h2>
            {latestScan ? (
              <span className="text-[13px] text-muted-foreground">
                Last scanned {new Date(latestScan.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ) : (
              <span className="text-[13px] text-muted-foreground">Scans run Mon / Wed / Fri</span>
            )}
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <JobScanPanel
              latestScan={latestScan}
              isScanning={isScanning}
              careerPageUrl={company.career_page_url}
              isVpUser={isVpUser}
              scanHistory={scanHistory}
            />

            <div className="px-6 py-5 border-t border-border bg-muted/60">
              <p className="text-[12px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Report a role we missed</p>
              <p className="text-[13px] text-muted-foreground mb-3">Paste a leadership role URL. We verify it and feed confirmed misses back into scanner training.</p>
              {missedRoleMsg ? (
                <Alert variant={missed === '1' ? 'success' : 'destructive'} className="mb-3">
                  <AlertDescription>{missedRoleMsg}</AlertDescription>
                </Alert>
              ) : null}
              <form action={reportMissedRole.bind(null, id)} className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-2">
                <Input
                  type="text"
                  name="role_url"
                  placeholder="https://boards.greenhouse.io/company/jobs/12345"
                  className="w-full text-foreground placeholder:text-muted-foreground"
                  required
                />
                <Input
                  type="text"
                  name="role_title"
                  placeholder="Optional title"
                  className="w-full text-foreground placeholder:text-muted-foreground"
                />
                <Button type="submit">
                  Submit
                </Button>
              </form>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Signals */}
        <AccordionItem value="signals" id="signals" className="border-b-0 bg-muted/40 border border-border rounded overflow-hidden">
          <AccordionTrigger className="cursor-pointer px-6 py-[18px] border-b border-border flex items-center justify-between hover:no-underline [&>svg]:hidden">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
              Company Signals
            </h2>
            <LogSignalForm companyId={company.id} />
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <SignalsPanel
              signals={signals}
              company={{ id: company.id, name: company.name, sector: company.sector }}
              profile={profile ?? null}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Interview Logs */}
        <AccordionItem value="interview-sessions" id="interview-sessions" className="border-b-0 bg-muted/40 border border-border rounded overflow-hidden">
          <AccordionTrigger className="cursor-pointer px-6 py-[18px] border-b border-border flex items-center justify-between hover:no-underline [&>svg]:hidden">
            <div>
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                Interview Sessions
              </h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">Each session sharpens the next prep brief.</p>
            </div>
            <span className="text-[13px] text-muted-foreground shrink-0">
              {interviewLogs.length} {interviewLogs.length === 1 ? 'session' : 'sessions'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <InterviewSessionsPanel companyId={id} interviewLogs={interviewLogs} todayISO={todayISO} />
          </AccordionContent>
        </AccordionItem>

        </Accordion>

      </main>
    </div>
  )
}
