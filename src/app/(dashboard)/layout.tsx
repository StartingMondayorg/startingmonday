import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DemoBanner } from '@/app/(dashboard)/_components/DemoBanner'
import { PersonalEmailNudge } from '@/app/(dashboard)/_components/PersonalEmailNudge'
import { WatermarkOverlay } from '@/app/(dashboard)/_components/WatermarkOverlay'
import { BottomNav } from '@/app/(dashboard)/_components/BottomNav'
import { CommandPalette } from '@/app/(dashboard)/_components/CommandPalette'
import { Toaster } from '@/components/ui'
import { DashboardFooter } from '@/app/(dashboard)/_components/DashboardFooter'
import { BackToTop } from '@/app/(dashboard)/_components/BackToTop'
import { resolveOrgScopeForUser } from '@/lib/org-scope'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgScope = await resolveOrgScopeForUser({
    userId: user.id,
    email: user.email ?? null,
  })

  if (!orgScope.ok) {
    redirect('/login?error=workspace_access')
  }

  const demoId = process.env.DEMO_USER_ID
  const isDemo = !!(user?.id && demoId && user.id === demoId)

  return (
    <>
      {/* PostHog is provided by the root layout. */}
      {isDemo && <DemoBanner />}
      {!isDemo && user?.email && <WatermarkOverlay email={user.email} />}
      <div id="top" className="nav-content-spacer min-h-screen bg-primary text-primary-foreground">
        {children}
        <DashboardFooter />
      </div>
      {!isDemo && user?.email && <PersonalEmailNudge email={user.email} />}
      <BottomNav />
      <BackToTop />
      <CommandPalette />
      <Toaster />
    </>
  )
}
