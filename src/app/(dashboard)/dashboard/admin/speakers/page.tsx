import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { SpeakersClient } from './speakers-client'
import { Card } from '@/components/ui/card'

export default async function SpeakersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()

  const { data } = await admin
    .from('conference_speakers')
    .select('*, conference_appearances(conference_name, conference_year, topic, session_type)')
    .order('priority', { ascending: true })
    .order('full_name', { ascending: true })

  const speakers = data ?? []

  // Summary stats
  const total = speakers.length
  const highPriority = speakers.filter(s => s.priority === 1 && s.outreach_status === 'not_started').length
  const contacted = speakers.filter(s => ['contacted', 'responded'].includes(s.outreach_status)).length
  const converted = speakers.filter(s => s.outreach_status === 'converted').length
  const conferences = new Set(
    speakers.flatMap(s => (s.conference_appearances ?? []).map((a: { conference_name: string }) => a.conference_name))
  ).size

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/customers" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Customers</Link>
            <Link href="/dashboard/admin/social" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Social</Link>
            <Link href="/dashboard/admin" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Admin</Link>
            <Link href="/dashboard" className="text-[13px] text-slate-300 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Conference Speakers</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">
            Target list for prospecting. Import a speaker CSV, track outreach status, export to Sales Navigator.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total speakers',    value: total },
            { label: 'High priority',     value: highPriority },
            { label: 'In outreach',       value: contacted },
            { label: 'Converted',         value: converted },
            { label: 'Conferences',       value: conferences },
          ].map(({ label, value }) => (
            <Card key={label} className="p-5">
              <div className={`text-[28px] font-bold ${label === 'Converted' && value > 0 ? 'text-green-600' : label === 'High priority' && value > 0 ? 'text-orange-500' : 'text-slate-900'}`}>
                {value}
              </div>
              <div className="text-[12px] text-slate-400 mt-1">{label}</div>
            </Card>
          ))}
        </div>

        <SpeakersClient initialSpeakers={speakers} />

      </main>
    </div>
  )
}

