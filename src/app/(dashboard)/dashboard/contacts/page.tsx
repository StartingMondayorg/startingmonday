import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addContact } from './actions'
import { ContactsList, type ContactListItem } from '@/components/ContactsList'
import { getUserSubscription, canAccessFeature } from '@/lib/subscription'
import { summarizeRelationshipNetwork, CONTACT_TYPE_LABELS } from '@/lib/relationship-infrastructure'
import { RelationshipMatchPanel } from './relationship-match-panel'
import { LinkedInImportManager } from './linkedin-import-manager'
import { LogoutButton } from '../logout-button'
import { isRelationshipNetworkMatchingEnabled } from '@/lib/feature-flags'

export const metadata = { title: 'Contacts' }

type UploadRow = {
  id: string
  consent_id: string | null
  source_file_name: string | null
  row_count: number | null
  processed_count: number | null
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  failure_reason: string | null
  uploaded_at: string
}

type ConsentRow = {
  id: string
  method: 'data_export' | 'portability_api'
  raw_file_name: string | null
  connection_count: number | null
  consented_at: string
  revoked_at: string | null
  data_deleted_at: string | null
}

type ImportSession = {
  consentId: string | null
  uploadId: string | null
  fileName: string | null
  method: 'data_export' | 'portability_api'
  rowCount: number
  processedCount: number
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'revoked' | 'deleted'
  failureReason: string | null
  uploadedAt: string | null
  consentedAt: string | null
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; company_id?: string }>
}) {
  const { saved, error: saveError, company_id: preselectedCompanyId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawContacts }, { data: companies }, { data: rawUploads }, { data: rawConsents }, sub] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, name, title, firm, channel, contact_type, last_role_discussed, notes, outreach_status, is_priority, companies(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_priority', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('name', { ascending: true }),
    supabase
      .from('linkedin_connection_uploads' as never)
      .select('id, consent_id, source_file_name, row_count, processed_count, status, failure_reason, uploaded_at')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(10),
    supabase
      .from('linkedin_import_consents')
      .select('id, method, raw_file_name, connection_count, consented_at, revoked_at, data_deleted_at')
      .eq('user_id', user.id)
      .order('consented_at', { ascending: false })
      .limit(10),
    getUserSubscription(user.id),
  ])

  const contacts = (rawContacts ?? []) as unknown as ContactListItem[]
  const companyList = companies ?? []
  const uploads = (rawUploads ?? []) as unknown as UploadRow[]
  const consents = (rawConsents ?? []) as unknown as ConsentRow[]
  const isExecutive = canAccessFeature(sub, 'recruiter_enhancements')
  const relationshipMatchingEnabled = isRelationshipNetworkMatchingEnabled()
  const relationshipSummary = summarizeRelationshipNetwork(contacts)

  const consentsById = new Map(consents.map((consent) => [consent.id, consent]))
  const seenConsentIds = new Set<string>()
  const importSessions: ImportSession[] = uploads.map((upload) => {
    const consent = upload.consent_id ? consentsById.get(upload.consent_id) ?? null : null
    if (consent?.id) seenConsentIds.add(consent.id)

    let status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'revoked' | 'deleted' = upload.status
    if (consent?.data_deleted_at) status = 'deleted'
    else if (consent?.revoked_at) status = 'revoked'

    return {
      consentId: consent?.id ?? upload.consent_id,
      uploadId: upload.id,
      fileName: upload.source_file_name ?? consent?.raw_file_name ?? null,
      method: consent?.method ?? 'data_export',
      rowCount: upload.row_count ?? consent?.connection_count ?? 0,
      processedCount: upload.processed_count ?? 0,
      status,
      failureReason: upload.failure_reason,
      uploadedAt: upload.uploaded_at,
      consentedAt: consent?.consented_at ?? null,
    }
  })

  for (const consent of consents) {
    if (seenConsentIds.has(consent.id)) continue
    importSessions.push({
      consentId: consent.id,
      uploadId: null,
      fileName: consent.raw_file_name,
      method: consent.method,
      rowCount: consent.connection_count ?? 0,
      processedCount: consent.connection_count ?? 0,
      status: consent.data_deleted_at ? 'deleted' : consent.revoked_at ? 'revoked' : 'processed',
      failureReason: null,
      uploadedAt: null,
      consentedAt: consent.consented_at,
    })
  }

  importSessions.sort((a, b) => {
    const aDate = new Date(a.uploadedAt ?? a.consentedAt ?? 0).getTime()
    const bDate = new Date(b.uploadedAt ?? b.consentedAt ?? 0).getTime()
    return bDate - aDate
  })

  const processedUploads = uploads
    .filter((upload) => upload.status === 'processed')
    .map((upload) => ({
      id: upload.id,
      label: `${upload.source_file_name ?? 'LinkedIn export'} · ${(upload.processed_count ?? upload.row_count ?? 0)} connections`,
    }))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_26%),linear-gradient(180deg,_#0b1220_0%,_#0a1020_46%,_#0b1324_100%)] font-sans text-slate-100">

      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-md border border-slate-700 px-3 text-[12px] font-semibold text-slate-200 hover:text-white hover:border-slate-500"
            >
              Dashboard
            </Link>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
<div className="mb-8 rounded-2xl border border-white/15 bg-white/5 px-5 py-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-300">Contacts</p>
          <h1 className="mt-1 text-[26px] font-bold text-white leading-tight">Relationship network</h1>
          <p className="text-[13px] text-slate-200 mt-1.5">
            Recruiters, hiring managers, and warm connections.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <p className="text-[13px] uppercase tracking-[0.12em] text-slate-400 mb-1">Network health</p>
            <p className="text-[24px] font-semibold text-white">{relationshipSummary.coverageScore}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <p className="text-[13px] uppercase tracking-[0.12em] text-slate-400 mb-1">Covered types</p>
            <p className="text-[24px] font-semibold text-white">{relationshipSummary.coveredTypes}/{Object.keys(CONTACT_TYPE_LABELS).length}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <p className="text-[13px] uppercase tracking-[0.12em] text-slate-400 mb-1">Gap</p>
            <p className="text-[14px] font-semibold text-slate-100 leading-snug">{relationshipSummary.coverageGapLabel}</p>
          </div>
        </div>

        <LinkedInImportManager sessions={importSessions} />

        {relationshipMatchingEnabled && companyList.length > 0 && (
          <RelationshipMatchPanel companies={companyList} uploads={processedUploads} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          <ContactsList contacts={contacts} isLeader={isExecutive} />

          {/* Add contact form */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <div className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-300 mb-4">
              Add contact
            </div>

            {saved && (
              <div className="mb-4 px-3 py-2 bg-emerald-500/10 border border-emerald-300/30 rounded text-[13px] text-emerald-200">
                Contact saved.
              </div>
            )}
            {saveError && (
              <div className="mb-4 px-3 py-2 bg-rose-500/10 border border-rose-300/30 rounded text-[13px] text-rose-200">
                Could not save contact. Please try again.
              </div>
            )}

            <form action={addContact} className="flex flex-col gap-3">

              <div>
                <label htmlFor="contact-name" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Jane Smith"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label htmlFor="contact-title" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Title
                </label>
                <input
                  id="contact-title"
                  name="title"
                  type="text"
                  placeholder="VP of Engineering"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label htmlFor="contact-firm" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Firm
                </label>
                <input
                  id="contact-firm"
                  name="firm"
                  type="text"
                  placeholder="Korn Ferry"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label htmlFor="contact-channel" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Channel
                </label>
                <select
                  id="contact-channel"
                  name="channel"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 focus:outline-none focus:border-white/30 bg-slate-950/70"
                >
                  <option value="">-</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="referral">Referral</option>
                  <option value="cold">Cold</option>
                  <option value="inbound">Inbound</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-type" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Relationship type
                </label>
                <select
                  id="contact-type"
                  name="contact_type"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 focus:outline-none focus:border-white/30 bg-slate-950/70"
                >
                  <option value="">-</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="peer">Peer</option>
                  <option value="coach">Coach</option>
                  <option value="board">Board</option>
                </select>
              </div>

              {companyList.length > 0 && (
                <div>
                  <label htmlFor="contact-company" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                    Company <span className="text-slate-300 font-normal">(optional)</span>
                  </label>
                  <select
                    id="contact-company"
                    name="company_id"
                    defaultValue={companyList.some(co => co.id === preselectedCompanyId) ? preselectedCompanyId : ''}
                    className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 focus:outline-none focus:border-white/30 bg-slate-950/70"
                  >
                    <option value="">- No company -</option>
                    {companyList.map(co => (
                      <option key={co.id} value={co.id}>{co.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="contact-email" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="text"
                  placeholder="jane@company.com"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label htmlFor="contact-linkedin" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  id="contact-linkedin"
                  name="linkedin_url"
                  type="text"
                  placeholder="https://linkedin.com/in/jane"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label htmlFor="contact-notes" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
                  Notes
                </label>
                <input
                  id="contact-notes"
                  name="notes"
                  type="text"
                  placeholder="Met at SaaStr, warm connection…"
                  className="w-full border border-white/15 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:border-white/30"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-slate-950 text-[13px] font-semibold py-2 rounded cursor-pointer border-0 mt-1 hover:bg-orange-400"
              >
                Add contact
              </button>

            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

