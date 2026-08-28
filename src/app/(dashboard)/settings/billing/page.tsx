import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/billing/subscription'
import { canUserSeeAdminHeader } from '@/lib/staff'
import { BillingClient } from './billing-client'
import { Alert, AlertDescription } from '@/components/ui'
export const metadata = { title: 'Billing - Starting Monday' }

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [sub, profileResult] = await Promise.all([
    getUserSubscription(user.id),
    supabase.from('user_profiles').select('full_name, placed_at').eq('user_id', user.id).single(),
  ])

  const accountName = profileResult.data?.full_name ?? null
  const isPlaced = !!profileResult.data?.placed_at
  const canSeeAdminHeader = await canUserSeeAdminHeader(user.email ?? '')

  return (
    <main>
      <h1 className="sr-only">Billing Settings</h1>
      <nav className="sr-only" aria-label="Billing quick actions">
        <Link href="/settings/security">Back to settings</Link>
        <Link href="/settings/security">Open security settings</Link>
        <Link href="/dashboard">Return to dashboard</Link>
      </nav>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
        <Alert className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-foreground">Need billing help?</p>
            <AlertDescription className="text-[12px] text-muted-foreground">Open the guide with a billing-focused query.</AlertDescription>
          </div>
          <Link href="/guide?q=How+do+I+fix+billing+or+subscription+issues%3F" className="text-[12px] font-semibold text-foreground hover:text-muted-foreground hover:underline">
            Open Guide
          </Link>
        </Alert>
      </section>
      <BillingClient sub={sub} hasStripeCustomer={sub.isPaid} accountEmail={user.email ?? ''} accountName={accountName} isPlaced={isPlaced} canSeeAdminHeader={canSeeAdminHeader} />
    </main>
  )
}
