import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export const metadata = { title: 'Prep Brief Rubric - Starting Monday Admin' }

export default async function TraceRubricPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const rubricPath = path.join(process.cwd(), 'src', 'evals', 'prep_brief_rubric.md')
  const rubric = await fs.readFile(rubricPath, 'utf8').catch(() => null)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_28%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#020617_100%)] font-sans text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
              <span className="text-white">Starting </span><span className="text-orange-300">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/traces" className="text-[13px] text-slate-300 hover:text-white transition-colors">
              LLM Traces
            </Link>
            <Link href="/dashboard/admin" className="text-[13px] text-slate-300 hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-[26px] font-bold text-white mb-2">Prep Brief Rubric</h1>
        <p className="text-[13px] text-slate-300 mb-6">
          Use this during trace review. Mark Pass only when every binary check is satisfied.
        </p>

        {rubric ? (
          <Card variant="glass" className="p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
            <pre className="text-[12px] leading-relaxed text-slate-200 whitespace-pre-wrap">{rubric}</pre>
          </Card>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Rubric file not found</AlertTitle>
            <AlertDescription>Expected: src/evals/prep_brief_rubric.md</AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  )
}
