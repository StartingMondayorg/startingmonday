import { requireEntitlement } from '@/lib/entitlements'

// R-6 gate: coach-tier accounts only; mirrors /dashboard/coach.
export default async function CoachClientsGateLayout({ children }: { children: React.ReactNode }) {
  await requireEntitlement('coach')
  return <>{children}</>
}