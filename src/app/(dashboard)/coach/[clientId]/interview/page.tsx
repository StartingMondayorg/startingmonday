import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

export const metadata = {
  title: 'Client Interview Prep - Starting Monday',
  description: 'View and manage client interview preparation.',
}

export default async function CoachClientInterviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { clientId } = await params

  // TODO: Fetch client's interview prep data from Supabase
  const clientData = {
    companyName: 'Figma',
    roleTitle: 'VP Engineering',
    interviewDate: '2026-06-28T10:00',
    positioning: 'I build engineering teams that scale from startup chaos to systematic execution.',
    companyContext: 'Figma just announced $200M Series D. They are expanding into enterprise collaboration.',
    roleCompletion: 75,
  }

  return (
    <div className="space-y-8">
      <h1 className="sr-only">Interview</h1>
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-[24px] font-bold tracking-tight text-white">
          Interview Prep
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-400">
          Viewing {clientData.companyName} preparation
        </p>
      </div>

      {/* Coach actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="px-4 py-2 text-[13px] bg-orange-500 text-slate-900 hover:bg-orange-600">
          Assign homework
        </Button>
        <Button variant="outline" className="px-4 py-2 text-[13px] border-slate-700 text-slate-300 hover:border-slate-600">
          Leave feedback
        </Button>
      </div>

      {/* Client's prep data */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-2">
            Company & Role
          </p>
          <p className="text-[16px] font-semibold text-white">
            {clientData.companyName} - {clientData.roleTitle}
          </p>
          {clientData.interviewDate && (
            <p className="text-[13px] text-slate-400 mt-1">
              Interview: {new Date(clientData.interviewDate).toLocaleString()}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">
            Their Positioning
          </p>
          <p className="text-[14px] leading-relaxed text-slate-200">
            {clientData.positioning}
          </p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">
            Company Context Research
          </p>
          <p className="text-[14px] leading-relaxed text-slate-200">
            {clientData.companyContext}
          </p>
        </div>
      </Card>

      {/* Completion status */}
      <Card variant="glass" className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-slate-300">Interview prep completion</p>
          <p className="text-[13px] font-semibold text-orange-300">{clientData.roleCompletion}%</p>
        </div>
        <Progress value={clientData.roleCompletion} className="gap-0 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-slate-950/50" />
      </Card>

      {/* Notes section */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-4">
        <p className="text-[13px] font-semibold text-slate-300">Coaching notes</p>
        <Textarea
          placeholder="Add feedback or notes for your client..."
          rows={4}
          className="w-full bg-slate-950/50 border-slate-700/50 text-[14px] text-white placeholder-slate-500 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/30"
        />
        <Button variant="secondary" className="px-4 py-2 text-[13px] bg-slate-800 text-white hover:bg-slate-700">
          Save notes
        </Button>
      </Card>

      {/* Back to client */}
      <Link
        href={`/coach/${clientId}`}
        className="text-[13px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
      >
        ← View all client tasks
      </Link>
    </div>
  )
}
