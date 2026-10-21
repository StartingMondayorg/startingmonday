import { requireEntitlement } from '@/lib/entitlements'

// R-6 gate: accounts attached to a partner organisation only.
export default async function PartnerGateLayout({ children }: { children: React.ReactNode }) {
  await requireEntitlement('partner')
  return <>{children}</>
}