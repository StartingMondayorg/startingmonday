import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DemoBanner } from '@/app/(dashboard)/_components/DemoBanner'
import { WatermarkOverlay } from '@/app/(dashboard)/_components/WatermarkOverlay'
import { PrimaryNav } from '@/app/(dashboard)/_components/PrimaryNav'
import { CommandPalette } from '@/app/(dashboard)/_components/CommandPalette'
import { Toaster } from '@/components/ui'
import { DashboardFooter } from '@/app/(dashboard)/_components/DashboardFooter'
import { BackToTop } from '@/app/(dashboard)/_components/BackToTop'
import { resolveOrgScopeForUser } from '@/lib/org-scope'
import { getUserSubscription } from '@/lib/billing/subscription'
import { getStaffMember } from '@/lib/staff'
import { isEntitled } from '@/lib/entitlements'

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

  // R-6: the palette hides tier-gated destinations the account would be redirected away from.
  const [subscription, staff] = await Promise.all([getUserSubscription(user.id, supabase), getStaffMember(user.email ?? '')])
  const aiChatEnabled = isEntitled('ai_chat', { subscription, partnerId: orgScope.partnerId, staff })

  const demoId = process.env.DEMO_USER_ID
  const isDemo = !!(user?.id && demoId && user.id === demoId)

  return (
    <>
      {/* PostHog is provided by the root layout. */}
      {isDemo && <DemoBanner />}
      {!isDemo && user?.email && <WatermarkOverlay email={user.email} />}
      <div id="top" className="nav-content-spacer min-h-screen bg-background text-foreground md:pl-16">
        {children}
        <DashboardFooter />
      </div>
      <PrimaryNav />
      <BackToTop />
      <CommandPalette aiChatEnabled={aiChatEnabled} />
      <Toaster />
    </>
  )
}
