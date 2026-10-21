import { requireEntitlement } from '@/lib/entitlements'

// R-6 gate: coach-tier accounts only (canAccessFeature coach_dashboard); others return to /dashboard.
export default async function CoachGateLayout({ children }: { children: React.ReactNode }) {
  await requireEntitlement('coach')
  return <>{children}</>
}