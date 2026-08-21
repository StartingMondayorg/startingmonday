import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button, Card, Progress, Textarea } from '@/components/ui'
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
        <h2 className="text-[24px] font-bold tracking-tight text-foreground">
          Interview Prep
        </h2>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Viewing {clientData.companyName} preparation
        </p>
      </div>

      {/* Coach actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="px-4 py-2 text-[13px]">
          Assign homework
        </Button>
        <Button variant="outline" className="px-4 py-2 text-[13px] border-border text-muted-foreground">
          Leave feedback
        </Button>
      </div>

      {/* Client's prep data */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Company & Role
          </p>
          <p className="text-[16px] font-semibold text-foreground">
            {clientData.companyName} - {clientData.roleTitle}
          </p>
          {clientData.interviewDate && (
            <p className="text-[13px] text-muted-foreground mt-1">
              Interview: {new Date(clientData.interviewDate).toLocaleString()}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
            Their Positioning
          </p>
          <p className="text-[14px] leading-relaxed text-foreground">
            {clientData.positioning}
          </p>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
            Company Context Research
          </p>
          <p className="text-[14px] leading-relaxed text-foreground">
            {clientData.companyContext}
          </p>
        </div>
      </Card>

      {/* Completion status */}
      <Card variant="glass" className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-muted-foreground">Interview prep completion</p>
          <p className="text-[13px] font-semibold text-primary">{clientData.roleCompletion}%</p>
        </div>
        <Progress value={clientData.roleCompletion} className="gap-0 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-background/50" />
      </Card>

      {/* Notes section */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-4">
        <p className="text-[13px] font-semibold text-muted-foreground">Coaching notes</p>
        <Textarea
          placeholder="Add feedback or notes for your client..."
          rows={4}
          className="w-full bg-background/50 border-border/50 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-primary/30"
        />
        <Button variant="secondary" className="px-4 py-2 text-[13px] bg-muted text-foreground hover:bg-muted/90">
          Save notes
        </Button>
      </Card>

      {/* Back to client */}
      <Link
        href={`/coach/${clientId}`}
        className="text-[13px] font-semibold text-primary transition-colors"
      >
        ← View all client tasks
      </Link>
    </div>
  )
}
