import { type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { isRateLimited } from '@/lib/api-usage'
import { checkBurstLimit } from '@/lib/burst-limit'
import { type SupabaseClient } from '@supabase/supabase-js'

type PrepAccessResult =
  | { ok: true; userId: string; tier: string; supabase: SupabaseClient }
  | { ok: false; response: Response }

// Single guard used by all /api/prep/[id]/* routes.
// Checks: auth → subscription (prep_brief feature) → monthly/daily rate limit.
export async function requirePrepAccess(request: NextRequest): Promise<PrepAccessResult> {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth

  const { userId } = auth
  const supabase = await createClient()

  if (!(await checkBurstLimit(userId))) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Too many requests. Wait a moment before generating another brief.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  const sub = await getUserSubscription(userId, supabase)
  if (!canAccessFeature(sub, 'prep_brief')) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Interview prep requires a Search plan.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  if (await isRateLimited(supabase, userId)) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Monthly token limit reached.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  return { ok: true, userId, tier: sub.tier, supabase }
}
