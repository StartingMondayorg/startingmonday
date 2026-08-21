import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { Card } from '@/components/ui/card'
import ProfileEditor from './profile-editor'
import ActionPanel from './action-panel'

export const metadata = { title: 'Live Brief Request - Starting Monday Admin' }

type DetailClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown | null }>
      }
    }
  }
}

type RequestDetail = {
  id: string
  prospect_name: string
  prospect_email: string
  linkedin_url: string | null
  consent_attested_at: string
  consent_source: string
  request_received_at: string
  request_source: string
  location_preference: string | null
  target_role_lane: string | null
  reviewed_profile: Record<string, unknown>
  status: string
  hubspot_contact_id: string | null
  hubspot_deal_id: string | null
  hubspot_sync_status: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default async function LiveBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient() as unknown as DetailClient
  const { data } = await admin
    .from('live_brief_requests')
    .select('id,prospect_name,prospect_email,linkedin_url,consent_attested_at,consent_source,request_received_at,request_source,location_preference,target_role_lane,reviewed_profile,status,hubspot_contact_id,hubspot_deal_id,hubspot_sync_status')
    .eq('id', id)
    .maybeSingle()
  const request = data as RequestDetail | null
  if (!request) notFound()

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[14px]">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/live-briefs" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200">Live briefs</Link>
            <Link href="/dashboard" className="text-[13px] text-slate-300 hover:text-white">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/dashboard/admin/live-briefs" className="text-[12px] font-semibold text-slate-500 hover:text-slate-900">← Back to queue</Link>
        <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">Live brief request</p>
            <h1 className="mt-1 text-[26px] font-bold text-slate-900">{request.prospect_name}</h1>
            <p className="mt-1 text-[13px] text-slate-500">{request.prospect_email}</p>
          </div>
          <span className="rounded bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white">{request.status.replaceAll('_', ' ')}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Request</h2>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div><dt className="text-slate-400">Received</dt><dd className="mt-0.5 text-slate-800">{formatDate(request.request_received_at)}</dd></div>
                <div><dt className="text-slate-400">Source</dt><dd className="mt-0.5 text-slate-800">{request.request_source.replaceAll('_', ' ')}</dd></div>
                <div><dt className="text-slate-400">Consent provenance</dt><dd className="mt-0.5 text-slate-800">{request.consent_source}</dd></div>
                <div><dt className="text-slate-400">Consent attested</dt><dd className="mt-0.5 text-slate-800">{formatDate(request.consent_attested_at)}</dd></div>
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Profile context</h2>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div><dt className="text-slate-400">Role lane</dt><dd className="mt-0.5 text-slate-800">{request.target_role_lane ?? 'Not set'}</dd></div>
                <div><dt className="text-slate-400">Location preference</dt><dd className="mt-0.5 text-slate-800">{request.location_preference ?? 'Not set'}</dd></div>
                <div><dt className="text-slate-400">LinkedIn URL</dt><dd className="mt-0.5 break-all text-slate-800">{request.linkedin_url ?? 'Not supplied'}</dd></div>
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">CRM link</h2>
              <p className="mt-4 text-[13px] text-slate-800">{request.hubspot_contact_id ? `Contact ${request.hubspot_contact_id}` : 'No HubSpot contact linked'}</p>
              <p className="mt-1 text-[12px] text-slate-400">{request.hubspot_deal_id ? `Deal ${request.hubspot_deal_id}` : 'No deal linked'} · {request.hubspot_sync_status.replaceAll('_', ' ')}</p>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Reviewed profile</h2>
              <span className="text-[11px] text-slate-400">{Object.keys(request.reviewed_profile ?? {}).length} fields</span>
            </div>
            <ProfileEditor requestId={request.id} initialProfile={request.reviewed_profile ?? {}} />
          </Card>
        </div>
        <div className="mt-4">
          <ActionPanel requestId={request.id} status={request.status} reviewedProfile={request.reviewed_profile ?? {}} />
        </div>
      </main>
    </div>
  )
}