import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DemoBanner } from '@/components/DemoBanner'
import { PersonalEmailNudge } from '@/components/PersonalEmailNudge'
import { WatermarkOverlay } from '@/components/WatermarkOverlay'
import { BottomNav } from '@/components/BottomNav'
import { CommandPalette } from '@/components/CommandPalette'
import { ToastProvider } from '@/lib/toast'
import { DashboardFooter } from '@/components/DashboardFooter'
import { BackToTop } from '@/components/BackToTop'
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
    <ToastProvider>
      {/* PostHog is provided by the root layout. */}
      {isDemo && <DemoBanner />}
      {!isDemo && user?.email && <WatermarkOverlay email={user.email} />}
      <div id="top" className="nav-content-spacer min-h-screen bg-slate-950 text-slate-100">
        {children}
        <DashboardFooter />
      </div>
      {!isDemo && user?.email && <PersonalEmailNudge email={user.email} />}
      <BottomNav />
      <BackToTop />
      <CommandPalette />
    </ToastProvider>
  )
}
