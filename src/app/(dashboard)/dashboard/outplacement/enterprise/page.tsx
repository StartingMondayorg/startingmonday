import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Enterprise View | Starting Monday',
  description: 'Sponsor-safe enterprise view for governance, reporting, and review gates.',
}

const GOVERNANCE_ROWS = [
  { label: 'Sponsor report readiness', value: 'Ready', note: 'Monthly report template and claims policy aligned.' },
  { label: 'Day-30 review gate', value: 'On track', note: 'Activation, stall, and action velocity reported together.' },
  { label: 'Participant identity exposure', value: 'Permission-gated', note: 'No blanket sponsor visibility.' },
]

export default async function EnterpriseViewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard/outplacement" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px] text-slate-300">
            <Link href="/dashboard/outplacement/operator" className="hover:text-white transition-colors">Operator console</Link>
            <Link href="/dashboard/outplacement/sponsor-report" className="hover:text-white transition-colors">Sponsor report</Link>
            <Link href="/for-chro" className="hover:text-white transition-colors">CHRO page</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card className="px-6 py-5">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-1">Enterprise view</p>
          <h1 className="text-[24px] font-bold text-slate-900 leading-tight">Sponsor-safe reporting and governance gates</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            This surface is designed for enterprise sponsors who need cohort-level visibility, clear thresholds, and permission-gated disclosure.
          </p>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GOVERNANCE_ROWS.map((row) => (
            <Card key={row.label} className="p-4">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">{row.label}</p>
              <p className="mt-1 text-[22px] font-bold text-slate-900">{row.value}</p>
              <p className="mt-1 text-[12px] text-slate-500">{row.note}</p>
            </Card>
          ))}
        </section>

        <Card className="p-5 gap-3">
          <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-500">Reporting pack</h2>
          <p className="text-[13px] text-slate-700">Activation rate, action velocity, stall index, and counselor observations are presented with methodology notes and caveats.</p>
          <p className="text-[13px] text-slate-700">Review gates at day 30 and day 60 determine whether the cohort expands, holds, or closes.</p>
          <p className="text-[13px] text-slate-700">Participant identities remain hidden unless the sponsor has explicit permission to view them.</p>
        </Card>
      </main>
    </div>
  )
}
