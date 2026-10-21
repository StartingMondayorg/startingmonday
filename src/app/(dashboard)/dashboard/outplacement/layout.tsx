import { requireEntitlement } from '@/lib/entitlements'

// R-6 gate: accounts attached to a partner organisation only; others return to /dashboard.
export default async function OutplacementGateLayout({ children }: { children: React.ReactNode }) {
  await requireEntitlement('partner')
  return <>{children}</>
}