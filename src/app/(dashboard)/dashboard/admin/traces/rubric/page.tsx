import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { Alert, AlertDescription, AlertTitle, Card } from '@/components/ui'
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
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
              <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/traces" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              LLM Traces
            </Link>
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-[26px] font-bold text-foreground mb-2">Prep Brief Rubric</h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Use this during trace review. Mark Pass only when every binary check is satisfied.
        </p>

        {rubric ? (
          <Card variant="glass" className="p-5 shadow-lg">
            <pre className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">{rubric}</pre>
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
