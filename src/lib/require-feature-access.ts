import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { isRateLimited } from '@/lib/api-usage'
import { checkBurstLimit } from '@/lib/burst-limit'
import { type SupabaseClient } from '@supabase/supabase-js'

type FeatureAccessResult =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; response: NextResponse }

// Single guard for all AI feature routes.
// Checks: auth → subscription (feature gate) → monthly/daily rate limit.
// Returns { userId, supabase } on success, or a ready-to-return error response.
export async function requireFeatureAccess(
  request: NextRequest,
  feature: string,
): Promise<FeatureAccessResult> {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth

  const { userId } = auth
  const supabase = await createClient()

  const sub = await getUserSubscription(userId)
  if (!canAccessFeature(sub, feature)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'upgrade_required', plan: 'active' },
        { status: 402 },
      ),
    }
  }

  if (!(await checkBurstLimit(userId))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 },
      ),
    }
  }

  if (await isRateLimited(supabase, userId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Monthly token limit reached.' },
        { status: 429 },
      ),
    }
  }

  return { ok: true, userId, supabase }
}
