import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { signalLabel, SIGNAL_COLORS } from '@/lib/intelligence'
import { FollowUpItem } from '@/app/(dashboard)/dashboard/_components/FollowUpItem'
import { ContactStatusStepper } from '@/app/(dashboard)/dashboard/_components/ContactStatusStepper'
import { markContactSentForm, scheduleMeetingFollowUp } from '../actions'
import { addContactFollowUp, logOutreach } from './actions'

const CHANNEL: Record<string, { label: string; cls: string }> = {
  linkedin:  { label: 'LinkedIn',  cls: 'bg-blue-500/15 text-blue-200' },
  referral:  { label: 'Referral',  cls: 'bg-emerald-500/15 text-emerald-200' },
  cold:      { label: 'Cold',      cls: 'bg-white/10 text-slate-300' },
  inbound:   { label: 'Inbound',   cls: 'bg-indigo-500/15 text-indigo-200' },
  event:     { label: 'Event',     cls: 'bg-amber-500/15 text-amber-200' },
  recruiter: { label: 'Recruiter', cls: 'bg-white/10 text-slate-200' },
}

function normalizeSignalClass(signalClass: string): string {
  if (/(purple|fuchsia|violet|rose|pink|indigo|cyan|teal|yellow|blue|green|red)-/.test(signalClass)) {
    return 'bg-white/10 text-slate-200'
  }
  return signalClass
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
    ? (CHANNEL[contact.channel] ?? { label: contact.channel, cls: 'bg-white/10 text-slate-300' })
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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">

      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href="/dashboard/contacts" className="text-[13px] text-slate-300 hover:text-white transition-colors">
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
        <section className="bg-white/5 border border-white/15 rounded-lg p-6 mb-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white text-[16px] font-bold shrink-0">
                {contact.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold text-white leading-tight truncate">{contact.name}</h1>
                {(contact.title || companyName) && (
                  <p className="text-[14px] text-slate-400 mt-0.5 truncate">
                    {[contact.title, companyName].filter(Boolean).join(' at ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {ch && (
                <span className={`text-[13px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full ${ch.cls}`}>
                  {ch.label}
                </span>
              )}
              <Link
                href={`/dashboard/contacts/${id}/edit`}
                className="text-[13px] font-semibold text-slate-400 hover:text-white border border-white/15 hover:border-white/40 rounded px-3 py-1.5 transition-colors min-h-[32px] flex items-center"
              >
                Edit
              </Link>
            </div>
          </div>

          {/* Contact details row */}
          <div className="flex flex-wrap gap-4 text-[13px] text-slate-400 mb-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.3"/></svg>
                {contact.email}
              </a>
            )}
            {contact.linkedin_url && (
              <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
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
              <span className="text-slate-400">Never contacted</span>
            )}
            {isRecruiterContact && (
              <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${warmth === 'warm' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/10 text-slate-400'}`}>
                {warmth === 'warm' ? 'Warm' : 'Cold'}
              </span>
            )}
          </div>

          {/* Recruiter-specific: last role discussed */}
          {isRecruiterContact && contact.last_role_discussed && (
            <div className="flex items-center gap-2 text-[13px] text-slate-400 mb-4">
              <span className="font-semibold text-slate-300">Last role discussed:</span>
              <span>{contact.last_role_discussed}</span>
            </div>
          )}

          {contact.notes && (
            <p className="text-[13px] text-slate-400 bg-white/5 rounded px-4 py-3 mb-4 leading-relaxed">
              {contact.notes}
            </p>
          )}

          {/* Outreach status stepper */}
          <div className="mb-4">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">Status</h2>
            <ContactStatusStepper
              contactId={id}
              currentStatus={contact.outreach_status ?? 'prospect'}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/dashboard/contacts/${id}/outreach`}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 text-[13px] font-semibold px-5 py-2.5 rounded transition-colors"
            >
              Draft outreach
            </Link>
            <form action={markContactSentForm.bind(null, id, contact.name)}>
              <button
                type="submit"
                className="border border-white/15 hover:border-white/40 text-slate-200 text-[13px] font-semibold px-5 py-2.5 rounded transition-colors cursor-pointer bg-white/5"
              >
                Mark contacted
              </button>
            </form>
            <form action={scheduleMeetingFollowUp.bind(null, id, contact.name)}>
              <button
                type="submit"
                className="border border-white/15 hover:border-white/40 text-slate-200 text-[13px] font-semibold px-5 py-2.5 rounded transition-colors cursor-pointer bg-white/5"
              >
                Schedule meeting
              </button>
            </form>
            {contact.linkedin_url && (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/15 hover:border-white/40 text-slate-200 text-[13px] font-semibold px-5 py-2.5 rounded transition-colors"
              >
                View LinkedIn
              </a>
            )}
          </div>
        </section>

        {linkedCompany && (
          <section className="bg-white/5 border border-white/15 rounded-lg p-5 mb-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Linked company</h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Link href={`/dashboard/companies/${linkedCompany.id}`} className="text-[14px] font-semibold text-white hover:text-slate-200 transition-colors">
                  {linkedCompany.name}
                </Link>
                {linkedCompany.stage && (
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    Stage: {stageLabel[linkedCompany.stage] ?? linkedCompany.stage}
                  </p>
                )}
                <p className="text-[13px] text-slate-400 mt-1.5">
                  Next action: <span className="font-semibold text-slate-200">{nextCompanyAction}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/companies/${linkedCompany.id}`}
                  className="text-[13px] font-semibold text-slate-200 border border-white/15 hover:border-white/40 px-3 py-1.5 rounded transition-colors"
                >
                  Open company
                </Link>
                <Link
                  href={`/dashboard/companies/${linkedCompany.id}/prep`}
                  className="text-[13px] font-semibold bg-orange-500 hover:bg-orange-400 text-slate-950 px-3 py-1.5 rounded transition-colors"
                >
                  Prep
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Mark contacted confirmation */}
        {sent === '1' && (
          <div className="bg-emerald-500/10 border border-emerald-300/30 rounded-lg px-5 py-3 mb-5 text-[13px] text-emerald-200 font-medium">
            Marked as contacted. Follow-up scheduled for next week.
          </div>
        )}

        {/* Log outreach confirmation */}
        {logged === '1' && (
          <div className="bg-emerald-500/10 border border-emerald-300/30 rounded-lg px-5 py-3 mb-5 text-[13px] text-emerald-200 font-medium">
            Outreach logged.
          </div>
        )}

        {meeting === '1' && (
          <div className="bg-emerald-500/10 border border-emerald-300/30 rounded-lg px-5 py-3 mb-5 text-[13px] text-emerald-200 font-medium">
            Meeting follow-up scheduled.
          </div>
        )}

        {/* Warm path alert */}
        {mostRecentSignal && (
          <section className="bg-amber-500/10 border border-amber-300/30 rounded-lg px-5 py-4 mb-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-amber-200 mb-2">
              Timing signal at {companyName}
            </h2>
            <div className="flex items-start gap-3">
              <span className={[
                'shrink-0 text-[13px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full mt-0.5',
                normalizeSignalClass(SIGNAL_COLORS[mostRecentSignal.signal_type] ?? 'bg-white/10 text-slate-300'),
              ].join(' ')}>
                {signalLabel(mostRecentSignal.signal_type)}
              </span>
              <div>
                <p className="text-[14px] text-slate-200 leading-relaxed">{mostRecentSignal.signal_summary}</p>
                <p className="text-[13px] text-amber-300 mt-1 font-medium">
                  {fmtDate(mostRecentSignal.signal_date)} - strong moment to reach out
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/contacts/${id}/outreach`}
              className="mt-3 inline-block text-[13px] font-semibold text-amber-100 hover:text-amber-100 underline transition-colors"
            >
              Draft a message using this signal
            </Link>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Follow-ups */}
          <section className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Follow-ups</h2>
              {pendingFollowUps.length > 0 && (
                <span className="text-[13px] font-semibold text-rose-300">{pendingFollowUps.length} pending</span>
              )}
            </div>

            {/* Pending - interactive (mark done / edit) */}
            {pendingFollowUps.length > 0 && (
              <div className="divide-y divide-white/5">
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
              <div className="divide-y divide-white/5 border-t border-white/10">
                {doneFollowUps.slice(0, 3).map(fu => (
                  <div key={fu.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                    <span className="text-[13px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 shrink-0">
                      Done
                    </span>
                    <p className="text-[13px] text-slate-400 truncate">{fu.action}</p>
                  </div>
                ))}
              </div>
            )}

            {allFollowUps.length === 0 && (
              <div className="px-5 py-5 text-center text-[13px] text-slate-400">
                No follow-ups yet.
              </div>
            )}

            {/* Add follow-up form */}
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2.5">Add follow-up</p>
              <form action={addContactFollowUp.bind(null, id)} className="flex flex-col gap-2">
                <input
                  name="action"
                  required
                  placeholder="Send follow-up email"
                  className="w-full border border-white/15 bg-slate-950/70 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                />
                <div className="flex items-center gap-2">
                  <input
                    name="due_date"
                    type="date"
                    required
                    aria-label="Due date"
                    defaultValue={tomorrowISO}
                    className="border border-white/15 bg-slate-950/70 rounded px-3 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-white/40"
                  />
                  <button
                    type="submit"
                    className="ml-auto text-[13px] font-semibold text-slate-950 bg-orange-500 hover:bg-orange-400 rounded px-3 py-1.5 cursor-pointer border-0 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* Log outreach sent */}
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2.5">Log outreach sent</p>
              <form action={logOutreach.bind(null, id)} className="flex flex-col gap-2">
                <select
                  name="channel"
                  required
                  aria-label="Channel"
                  className="border border-white/15 rounded px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-white/40 bg-slate-900"
                >
                  <option value="">Select channel</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  name="message_preview"
                  placeholder="Paste first lines of your message (optional, 200 chars max)"
                  maxLength={200}
                  rows={2}
                  className="w-full border border-white/15 bg-slate-950/70 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-white/40 resize-none"
                />
                <button
                  type="submit"
                  className="self-end text-[13px] font-semibold text-slate-950 bg-orange-500 hover:bg-orange-400 rounded px-3 py-1.5 cursor-pointer border-0 transition-colors"
                >
                  Log sent
                </button>
              </form>
            </div>
          </section>

          {/* Company signals */}
          {contact.company_id && (
            <section className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">
                  {companyName} signals
                </h2>
                {contact.company_id && (
                  <Link
                    href={`/dashboard/companies/${contact.company_id}`}
                    className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    View company
                  </Link>
                )}
              </div>
              {companySignals.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {companySignals.map(sig => (
                    <div key={sig.id} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={[
                          'text-[13px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full',
                          normalizeSignalClass(SIGNAL_COLORS[sig.signal_type] ?? 'bg-white/10 text-slate-300'),
                        ].join(' ')}>
                          {signalLabel(sig.signal_type)}
                        </span>
                        <span className="text-[13px] text-slate-400">{fmtDate(sig.signal_date)}</span>
                      </div>
                      <p className="text-[13px] text-slate-200 leading-relaxed">{sig.signal_summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-[13px] text-slate-400">
                  No signals in the last 30 days.
                </div>
              )}
            </section>
          )}

        </div>

        {/* Recent outreach drafts */}
        {recentBriefs && recentBriefs.length > 0 && (
          <section className="bg-white/5 border border-white/15 rounded-lg overflow-hidden mt-5">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Recent drafts</h2>
              <Link href={`/dashboard/contacts/${id}/outreach`} className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                Draft new
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentBriefs.map(b => (
                <div key={b.id} className="px-5 py-4">
                  <div className="text-[13px] text-slate-400 mb-1.5">{fmtDate(b.created_at)}</div>
                  <p className="text-[13px] text-slate-200 leading-relaxed line-clamp-3">{b.output_text.slice(0, 280)}{b.output_text.length > 280 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

