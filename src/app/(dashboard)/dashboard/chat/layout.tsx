import { requireEntitlement } from '@/lib/entitlements'

// R-6 gate: tiers with the ai_chat feature only; others return to /dashboard.
export default async function ChatGateLayout({ children }: { children: React.ReactNode }) {
  await requireEntitlement('ai_chat')
  return <>{children}</>
}