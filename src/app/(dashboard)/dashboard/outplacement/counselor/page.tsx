import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Counselor View | Starting Monday',
  description: 'Counselor-native session prep, intervention queue, and what changed between sessions.',
}

const PREP_ITEMS = [
  'Read the latest signal changes before the session starts.',
  'Review confidence, momentum, and narrative drift notes.',
  'Confirm the one committed next action with a deadline.',
  'Spot any stalled lanes and address them first.',
]

const INTERVENTIONS = [
  { participant: 'Exec A', issue: 'No signal-driven action in 7 days', nextStep: 'Send a same-day reset note and confirm outreach target list.' },
  { participant: 'Exec B', issue: 'Narrative drift on “why now”', nextStep: 'Tighten the positioning thesis before the next interview.' },
  { participant: 'Exec C', issue: 'Pipeline stalled at research stage', nextStep: 'Re-rank targets and reset priority outreach sequence.' },
]

export default async function CounselorViewPage() {
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
            <Link href="/dashboard/outplacement/firm-admin" className="hover:text-white transition-colors">Firm admin</Link>
            <Link href="/dashboard/outplacement/enterprise" className="hover:text-white transition-colors">Enterprise</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card className="px-6 py-5">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-1">Counselor view</p>
          <h1 className="text-[24px] font-bold text-slate-900 leading-tight">What changed, what is stuck, what to do next</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            This view is built for the session floor: fast prep, clear intervention priorities, and a consistent opening sequence.
          </p>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Clients needing review', value: '11' },
            { label: 'Narrative drift flags', value: '4' },
            { label: 'Overdue actions', value: '7' },
            { label: 'Stalled lanes', value: '3' },
          ].map((card) => (
            <Card key={card.label} className="p-4">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">{card.label}</p>
              <p className="mt-1 text-[28px] font-bold text-slate-900">{card.value}</p>
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden gap-0 py-0">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-500">Pre-session checklist</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {PREP_ITEMS.map((item) => (
              <li key={item} className="px-5 py-4 text-[13px] text-slate-700">{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden gap-0 py-0">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-500">Intervention queue</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {INTERVENTIONS.map((item) => (
              <div key={item.participant} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr] gap-3 px-5 py-4">
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">{item.participant}</p>
                  <p className="text-[12px] text-slate-500 mt-1">{item.issue}</p>
                </div>
                <div className="text-[13px] text-slate-700">Recommended next step</div>
                <div className="text-[13px] text-slate-700">{item.nextStep}</div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
