import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addContact } from './actions'
import { ContactsList, type ContactListItem } from '@/app/(dashboard)/dashboard/_components/ContactsList'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { summarizeRelationshipNetwork, CONTACT_TYPE_LABELS } from '@/lib/outreach/relationship-infrastructure'
import { RelationshipMatchPanel } from './relationship-match-panel'
import { LinkedInImportManager } from './linkedin-import-manager'
import { LogoutButton } from '../logout-button'
import { isRelationshipNetworkMatchingEnabled } from '@/lib/feature-flags'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
export const metadata = { title: 'Contacts' }

// shadcn Select can't have an item with value "" — use this sentinel for the
// "unset" option and strip it back to an empty string before calling the
// addContact server action below.
const NONE = '__none__'

const selectTriggerCls = 'w-full border-border rounded px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-border bg-background/70'

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

  async function addContactForm(formData: FormData) {
    'use server'
    for (const key of ['channel', 'contact_type', 'company_id']) {
      if (formData.get(key) === NONE) formData.set(key, '')
    }
    await addContact(formData)
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="min-h-[44px] border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground"
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        <Card variant="glass" className="mb-8 px-5 py-5 shadow-xl">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary">Contacts</p>
          <h1 className="mt-1 text-[26px] font-bold text-foreground leading-tight">Relationship network</h1>
          <p className="text-[13px] text-foreground mt-1.5">
            Recruiters, hiring managers, and warm connections.
          </p>
        </Card>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card variant="glass" className="px-4 py-3 shadow-xl">
            <p className="text-[13px] uppercase tracking-[0.12em] text-muted-foreground mb-1">Network health</p>
            <p className="text-[24px] font-semibold text-foreground">{relationshipSummary.coverageScore}</p>
          </Card>
          <Card variant="glass" className="px-4 py-3 shadow-xl">
            <p className="text-[13px] uppercase tracking-[0.12em] text-muted-foreground mb-1">Covered types</p>
            <p className="text-[24px] font-semibold text-foreground">{relationshipSummary.coveredTypes}/{Object.keys(CONTACT_TYPE_LABELS).length}</p>
          </Card>
          <Card variant="glass" className="px-4 py-3 shadow-xl">
            <p className="text-[13px] uppercase tracking-[0.12em] text-muted-foreground mb-1">Gap</p>
            <p className="text-[14px] font-semibold text-foreground leading-snug">{relationshipSummary.coverageGapLabel}</p>
          </Card>
        </div>

        {relationshipMatchingEnabled ? (
          <LinkedInImportManager sessions={importSessions} />
        ) : (
          <Alert variant="warning" className="mb-6 px-4 py-3">
            <AlertDescription className="text-[13px]">
              Relationship matching and LinkedIn import are currently limited to enabled pilot access.
            </AlertDescription>
          </Alert>
        )}

        {relationshipMatchingEnabled && companyList.length > 0 && (
          <RelationshipMatchPanel companies={companyList} uploads={processedUploads} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          <ContactsList contacts={contacts} isLeader={isExecutive} />

          {/* Add contact form */}
          <Card variant="glass" className="p-5 shadow-xl">
            <div className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">
              Add contact
            </div>

            {saved && (
              <Alert variant="success" className="mb-4 px-3 py-2">
                <AlertDescription className="text-[13px]">Contact saved.</AlertDescription>
              </Alert>
            )}
            {saveError && (
              <Alert variant="destructive" className="mb-4 px-3 py-2">
                <AlertDescription className="text-[13px]">Could not save contact. Please try again.</AlertDescription>
              </Alert>
            )}

            <form action={addContactForm} className="flex flex-col gap-3">

              <div>
                <Label htmlFor="contact-name" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Jane Smith"
                  className="w-full text-[13px] text-foreground placeholder:text-muted-foreground bg-background/70"
                />
              </div>

              <div>
                <Label htmlFor="contact-title" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Title
                </Label>
                <Input
                  id="contact-title"
                  name="title"
                  type="text"
                  placeholder="VP of Engineering"
                  className="w-full text-[13px] text-foreground placeholder:text-muted-foreground bg-background/70"
                />
              </div>

              <div>
                <Label htmlFor="contact-firm" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Firm
                </Label>
                <Input
                  id="contact-firm"
                  name="firm"
                  type="text"
                  placeholder="Korn Ferry"
                  className="w-full text-[13px] text-foreground placeholder:text-muted-foreground bg-background/70"
                />
              </div>

              <div>
                <Label htmlFor="contact-channel" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Channel
                </Label>
                <Select name="channel" defaultValue={NONE}>
                  <SelectTrigger id="contact-channel" className={selectTriggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>-</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contact-type" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Relationship type
                </Label>
                <Select name="contact_type" defaultValue={NONE}>
                  <SelectTrigger id="contact-type" className={selectTriggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>-</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                    <SelectItem value="peer">Peer</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="board">Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {companyList.length > 0 && (
                <div>
                  <Label htmlFor="contact-company" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                    Company <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Select
                    name="company_id"
                    defaultValue={companyList.some(co => co.id === preselectedCompanyId) ? preselectedCompanyId : NONE}
                  >
                    <SelectTrigger id="contact-company" className={selectTriggerCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>- No company -</SelectItem>
                      {companyList.map(co => (
                        <SelectItem key={co.id} value={co.id}>{co.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="contact-email" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="text"
                  placeholder="jane@company.com"
                  className="w-full text-[13px] text-foreground placeholder:text-muted-foreground bg-background/70"
                />
              </div>

              <div>
                <Label htmlFor="contact-linkedin" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  LinkedIn URL
                </Label>
                <Input
                  id="contact-linkedin"
                  name="linkedin_url"
                  type="text"
                  placeholder="https://linkedin.com/in/jane"
                  className="w-full text-[13px] text-foreground placeholder:text-muted-foreground bg-background/70"
                />
              </div>

              <div>
                <Label htmlFor="contact-notes" className="block text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                  Notes
                </Label>
                <Input
                  id="contact-notes"
                  name="notes"
                  type="text"
                  placeholder="Met at SaaStr, warm connection…"
                  className="w-full text-[13px] text-foreground placeholder:text-muted-foreground bg-background/70"
                />
              </div>

              <Button type="submit" className="w-full mt-1 text-[13px] font-semibold">
                Add contact
              </Button>

            </form>
          </Card>

        </div>
      </main>
    </div>
  )
}
