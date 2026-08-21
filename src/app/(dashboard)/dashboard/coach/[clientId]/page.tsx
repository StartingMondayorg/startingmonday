import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoachClientDataView } from '@/app/(dashboard)/dashboard/_components/client-data-view'
import { ClientAlertPreferences } from '@/app/(dashboard)/dashboard/_components/client-alert-preferences'
import { verifyCoachAccess } from '@/lib/coach-access'
import { Card } from '@/components/ui'
export default async function CoachClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { hasAccess } = await verifyCoachAccess(user.id, clientId)
  if (!hasAccess) {
    redirect('/dashboard/coach')
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard/coach" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            &larr; Back to Clients
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
          <div>
            <div className="mb-4">
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">Coach Workspace</p>
              <h1 className="text-[24px] font-bold text-foreground leading-tight">Client Data and Behavior Scorecards</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Pipeline, signals, briefs, and activity health for this client seat.
              </p>
            </div>
            <CoachClientDataView clientId={clientId} />
          </div>

          <div className="space-y-4">
            <ClientAlertPreferences clientId={clientId} />
            <Card className="bg-muted p-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Access Controls</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                The executive controls this access and can disable it anytime in Team settings.
                All data views are logged.
              </p>
              <Link href="/settings/team" className="inline-block mt-3 text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2">
                Open team access settings
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

