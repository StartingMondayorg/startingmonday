import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { signalLabel, SIGNAL_COLORS, SIGNAL_FALLBACK_COLOR } from '@/lib/intelligence/intelligence'
import { FollowUpItem } from '@/app/(dashboard)/dashboard/_components/FollowUpItem'
import { ContactStatusStepper } from '@/app/(dashboard)/dashboard/_components/ContactStatusStepper'
import { markContactSentForm, scheduleMeetingFollowUp } from '../actions'
import { addContactFollowUp, logOutreach } from './actions'
import { Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
const CHANNEL: Record<string, { label: string; cls: string }> = {
  linkedin:  { label: 'LinkedIn',  cls: 'bg-info/15 text-info' },
  referral:  { label: 'Referral',  cls: 'bg-success/15 text-success' },
  cold:      { label: 'Cold',      cls: 'bg-muted/60 text-muted-foreground' },
  inbound:   { label: 'Inbound',   cls: 'bg-info/15 text-info' },
  event:     { label: 'Event',     cls: 'bg-warning/15 text-warning' },
  recruiter: { label: 'Recruiter', cls: 'bg-muted/60 text-foreground' },
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000)
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sent?: string; logged?: string; meeting?: string }>
}) {
  const { id } = await params
  const { sent, logged, meeting } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayISO = new Date().toISOString().split('T')[0]
  const tomorrowISO = new Date(Date.now() + 86400_000).toISOString().split('T')[0]
  const since30d = new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]

  const [{ data: rawContact }, { data: followUps }, { data: recentBriefs }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, name, title, firm, channel, notes, email, linkedin_url, contacted_at, outreach_status, company_id, contact_type, last_role_discussed, companies(id, name, stage)')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single(),
    supabase
      .from('follow_ups')
      .select('id, due_date, action, status')
      .eq('user_id', user.id)
      .eq('contact_id', id)
      .order('status', { ascending: true })
      .order('due_date', { ascending: true })
      .limit(10),
    supabase
      .from('briefs')
      .select('id, output_text, created_at')
      .eq('user_id', user.id)
      .eq('contact_id', id)
      .eq('type', 'outreach')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  if (!rawContact) notFound()

  type ContactRow = typeof rawContact & {
    email?: string | null
    linkedin_url?: string | null
    outreach_status?: string | null
    contact_type?: string | null
    last_role_discussed?: string | null
    companies: { id: string; name: string; stage?: string | null } | null
  }
  const contact = rawContact as unknown as ContactRow

  const isRecruiterContact = contact.contact_type === 'recruiter' || contact.channel === 'recruiter'
  const warmth = !contact.contacted_at ? 'cold'
    : daysSince(contact.contacted_at)! <= 90 ? 'warm'
    : 'cold'

  // Fetch company signals if linked
  let companySignals: { id: string; signal_type: string; signal_summary: string; signal_date: string }[] = []
  if (contact.company_id) {
    const { data: sigs } = await supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, signal_date')
      .eq('company_id', contact.company_id)
      .eq('user_id', user.id)
      .neq('signal_type', 'pattern_alert')
      .gte('signal_date', since30d)
      .order('signal_date', { ascending: false })
      .limit(5)
    companySignals = sigs ?? []
  }

  const ch = contact.channel
    ? (CHANNEL[contact.channel] ?? { label: contact.channel, cls: 'bg-muted/60 text-muted-foreground' })
    : null
  const companyName = (contact.companies as { name: string } | null)?.name ?? contact.firm ?? null
  const daysSinceContacted = daysSince(contact.contacted_at)
  const mostRecentSignal = companySignals[0] ?? null
  const linkedCompany = contact.companies as { id: string; name: string; stage?: string | null } | null
  const stageLabel: Record<string, string> = {
    watching: 'Watching',
    researching: 'Researching',
    applied: 'In Process',
    interviewing: 'Interviewing',
    offer: 'Offer',
  }
  const nextCompanyAction = mostRecentSignal
    ? 'Use latest signal to send timely outreach'
    : linkedCompany?.stage === 'interviewing'
      ? 'Run interview prep before next conversation'
      : linkedCompany?.stage === 'watching'
        ? 'Move from watching to first outreach'
        : 'Review company and schedule next step'

  const allFollowUps = followUps ?? []
  const pendingFollowUps = allFollowUps.filter(f => f.status === 'pending')
  const doneFollowUps = allFollowUps.filter(f => f.status === 'completed')

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard/contacts" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Contacts
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Contacts', href: '/dashboard/contacts' },
            { label: contact.name },
          ]}
        />
        {/* Contact header */}
        <Card variant="glass" className="p-6 mb-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar size="lg" className="w-12 h-12 bg-muted/60 border border-border shrink-0">
                <AvatarFallback className="bg-transparent text-foreground text-[16px] font-bold">
                  {contact.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold text-foreground leading-tight truncate">{contact.name}</h1>
                {(contact.title || companyName) && (
                  <p className="text-[14px] text-muted-foreground mt-0.5 truncate">
                    {[contact.title, companyName].filter(Boolean).join(' at ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {ch && (
                <Badge className={`h-auto text-[13px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 ${ch.cls}`}>
                  {ch.label}
                </Badge>
              )}
              <Button
                variant="outline"
                className="text-[13px] font-semibold text-muted-foreground hover:text-foreground border-border px-3 py-1.5"
                render={<Link href={`/dashboard/contacts/${id}/edit`} />}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Contact details row */}
          <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground mb-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.3"/></svg>
                {contact.email}
              </a>
            )}
            {contact.linkedin_url && (
              <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 6v4M4 4.5v.5M6.5 10V7.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                LinkedIn
              </a>
            )}
            {contact.contacted_at && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Last contacted {daysSinceContacted === 0 ? 'today' : `${daysSinceContacted}d ago`}
              </span>
            )}
            {!contact.contacted_at && (
              <span className="text-muted-foreground">Never contacted</span>
            )}
            {isRecruiterContact && (
              <Badge
                variant={warmth === 'warm' ? 'success' : 'secondary'}
                className={`h-auto text-[13px] font-bold px-2 py-0.5 ${warmth === 'warm' ? '' : 'bg-muted/60 text-muted-foreground'}`}
              >
                {warmth === 'warm' ? 'Warm' : 'Cold'}
              </Badge>
            )}
          </div>

          {/* Recruiter-specific: last role discussed */}
          {isRecruiterContact && contact.last_role_discussed && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-4">
              <span className="font-semibold text-muted-foreground">Last role discussed:</span>
              <span>{contact.last_role_discussed}</span>
            </div>
          )}

          {contact.notes && (
            <p className="text-[13px] text-muted-foreground bg-muted/40 rounded px-4 py-3 mb-4 leading-relaxed">
              {contact.notes}
            </p>
          )}

          {/* Outreach status stepper */}
          <div className="mb-4">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Status</h2>
            <ContactStatusStepper
              contactId={id}
              currentStatus={contact.outreach_status ?? 'prospect'}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              className="text-[13px] font-semibold px-5 py-2.5"
              render={<Link href={`/dashboard/contacts/${id}/outreach`} />}
            >
              Draft outreach
            </Button>
            <form action={markContactSentForm.bind(null, id, contact.name)}>
              <Button
                type="submit"
                variant="outline"
                className="border-border text-foreground text-[13px] font-semibold px-5 py-2.5 bg-muted/40"
              >
                Mark contacted
              </Button>
            </form>
            <form action={scheduleMeetingFollowUp.bind(null, id, contact.name)}>
              <Button
                type="submit"
                variant="outline"
                className="border-border text-foreground text-[13px] font-semibold px-5 py-2.5 bg-muted/40"
              >
                Schedule meeting
              </Button>
            </form>
            {contact.linkedin_url && (
              <Button
                variant="outline"
                className="border-border text-foreground text-[13px] font-semibold px-5 py-2.5"
                render={<a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" />}
              >
                View LinkedIn
              </Button>
            )}
          </div>
        </Card>

        {linkedCompany && (
          <Card variant="glass" className="p-5 mb-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Linked company</h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Link href={`/dashboard/companies/${linkedCompany.id}`} className="text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  {linkedCompany.name}
                </Link>
                {linkedCompany.stage && (
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Stage: {stageLabel[linkedCompany.stage] ?? linkedCompany.stage}
                  </p>
                )}
                <p className="text-[13px] text-muted-foreground mt-1.5">
                  Next action: <span className="font-semibold text-foreground">{nextCompanyAction}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  className="text-[13px] font-semibold text-foreground border-border px-3 py-1.5"
                  render={<Link href={`/dashboard/companies/${linkedCompany.id}`} />}
                >
                  Open company
                </Button>
                <Button
                  className="text-[13px] font-semibold px-3 py-1.5"
                  render={<Link href={`/dashboard/companies/${linkedCompany.id}/prep`} />}
                >
                  Prep
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Mark contacted confirmation */}
        {sent === '1' && (
          <Alert variant="success" className="px-5 py-3 mb-5">
            <AlertDescription className="text-[13px] text-success font-medium">
              Marked as contacted. Follow-up scheduled for next week.
            </AlertDescription>
          </Alert>
        )}

        {/* Log outreach confirmation */}
        {logged === '1' && (
          <Alert variant="success" className="px-5 py-3 mb-5">
            <AlertDescription className="text-[13px] text-success font-medium">
              Outreach logged.
            </AlertDescription>
          </Alert>
        )}

        {meeting === '1' && (
          <Alert variant="success" className="px-5 py-3 mb-5">
            <AlertDescription className="text-[13px] text-success font-medium">
              Meeting follow-up scheduled.
            </AlertDescription>
          </Alert>
        )}

        {/* Warm path alert */}
        {mostRecentSignal && (
          <Alert variant="warning" className="px-5 py-4 mb-5">
            <AlertTitle className="text-[13px] font-bold tracking-[0.12em] uppercase text-warning mb-2">
              Timing signal at {companyName}
            </AlertTitle>
            <div className="flex items-start gap-3">
              <Badge className={`shrink-0 h-auto text-[13px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 mt-0.5 ${SIGNAL_COLORS[mostRecentSignal.signal_type] ?? SIGNAL_FALLBACK_COLOR}`}>
                {signalLabel(mostRecentSignal.signal_type)}
              </Badge>
              <div>
                <p className="text-[14px] text-foreground leading-relaxed">{mostRecentSignal.signal_summary}</p>
                <p className="text-[13px] text-warning mt-1 font-medium">
                  {fmtDate(mostRecentSignal.signal_date)} - strong moment to reach out
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/contacts/${id}/outreach`}
              className="mt-3 inline-block text-[13px] font-semibold text-warning underline transition-colors"
            >
              Draft a message using this signal
            </Link>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Follow-ups */}
          <Card variant="glass" className="gap-0 p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Follow-ups</h2>
              {pendingFollowUps.length > 0 && (
                <span className="text-[13px] font-semibold text-destructive">{pendingFollowUps.length} pending</span>
              )}
            </div>

            {/* Pending - interactive (mark done / edit) */}
            {pendingFollowUps.length > 0 && (
              <div className="divide-y divide-border">
                {pendingFollowUps.map(fu => {
                  const isToday = fu.due_date === todayISO
                  const dateLabel = isToday ? 'Today' : fmtShort(fu.due_date)
                  return (
                    <FollowUpItem
                      key={fu.id}
                      id={fu.id}
                      action={fu.action}
                      dueDate={fu.due_date}
                      dateLabel={dateLabel}
                      isToday={isToday}
                    />
                  )
                })}
              </div>
            )}

            {/* Done - static */}
            {doneFollowUps.length > 0 && (
              <div className="divide-y divide-border border-t border-border">
                {doneFollowUps.slice(0, 3).map(fu => (
                  <div key={fu.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                    <Badge variant="success" className="h-auto text-[13px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 shrink-0">
                      Done
                    </Badge>
                    <p className="text-[13px] text-muted-foreground truncate">{fu.action}</p>
                  </div>
                ))}
              </div>
            )}

            {allFollowUps.length === 0 && (
              <div className="px-5 py-5 text-center text-[13px] text-muted-foreground">
                No follow-ups yet.
              </div>
            )}

            {/* Add follow-up form */}
            <div className="border-t border-border px-5 py-4">
              <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Add follow-up</p>
              <form action={addContactFollowUp.bind(null, id)} className="flex flex-col gap-2">
                <Input
                  name="action"
                  required
                  placeholder="Send follow-up email"
                  className="w-full bg-background/70 text-[13px] text-foreground"
                />
                <div className="flex items-center gap-2">
                  <Input
                    name="due_date"
                    type="date"
                    required
                    aria-label="Due date"
                    defaultValue={tomorrowISO}
                    className="w-auto bg-background/70 text-[13px] text-foreground"
                  />
                  <Button
                    type="submit"
                    className="ml-auto text-[13px] font-semibold px-3 py-1.5"
                  >
                    Add
                  </Button>
                </div>
              </form>
            </div>

            {/* Log outreach sent */}
            <div className="border-t border-border px-5 py-4">
              <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Log outreach sent</p>
              <form action={logOutreach.bind(null, id)} className="flex flex-col gap-2">
                <Select name="channel" required>
                  <SelectTrigger aria-label="Channel" className="border-border text-foreground bg-card">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  name="message_preview"
                  placeholder="Paste first lines of your message (optional, 200 chars max)"
                  maxLength={200}
                  rows={2}
                  className="w-full bg-background/70 text-[13px] text-foreground resize-none"
                />
                <Button
                  type="submit"
                  className="self-end text-[13px] font-semibold px-3 py-1.5"
                >
                  Log sent
                </Button>
              </form>
            </div>
          </Card>

          {/* Company signals */}
          {contact.company_id && (
            <Card variant="glass" className="gap-0 p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                  {companyName} signals
                </h2>
                {contact.company_id && (
                  <Link
                    href={`/dashboard/companies/${contact.company_id}`}
                    className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View company
                  </Link>
                )}
              </div>
              {companySignals.length > 0 ? (
                <div className="divide-y divide-border">
                  {companySignals.map(sig => (
                    <div key={sig.id} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`h-auto tracking-[0.06em] uppercase px-2 py-0.5 ${SIGNAL_COLORS[sig.signal_type] ?? SIGNAL_FALLBACK_COLOR}`}>
                          {signalLabel(sig.signal_type)}
                        </Badge>
                        <span className="text-[13px] text-muted-foreground">{fmtDate(sig.signal_date)}</span>
                      </div>
                      <p className="text-[13px] text-foreground leading-relaxed">{sig.signal_summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                  No signals in the last 30 days.
                </div>
              )}
            </Card>
          )}

        </div>

        {/* Recent outreach drafts */}
        {recentBriefs && recentBriefs.length > 0 && (
          <Card variant="glass" className="gap-0 p-0 overflow-hidden mt-5">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Recent drafts</h2>
              <Link href={`/dashboard/contacts/${id}/outreach`} className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Draft new
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentBriefs.map(b => (
                <div key={b.id} className="px-5 py-4">
                  <div className="text-[13px] text-muted-foreground mb-1.5">{fmtDate(b.created_at)}</div>
                  <p className="text-[13px] text-foreground leading-relaxed line-clamp-3">{b.output_text.slice(0, 280)}{b.output_text.length > 280 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

      </main>
    </div>
  )
}

