import { type NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'

const AUTOMATION_SERVICE_TOKEN_HEADER = 'x-automation-service-token'
const AUTOMATION_SERVICE_USER_HEADER = 'x-automation-user-id'

export function extractAutomationServiceToken(request: NextRequest): string {
  const explicitToken = request.headers.get(AUTOMATION_SERVICE_TOKEN_HEADER)?.trim() ?? ''
  if (explicitToken) return explicitToken

  const authorization = request.headers.get('authorization') ?? ''
  const [scheme, value] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer') return ''
  return value?.trim() ?? ''
}

export function tokensMatch(actual: string, expected: string): boolean {
  if (!actual || !expected) return false

  try {
    const left = Buffer.from(actual)
    const right = Buffer.from(expected)
    if (left.length !== right.length) return false
    return timingSafeEqual(left, right)
  } catch {
    return false
  }
}

export type StaffAutomationAuthResult =
  | { ok: false; response: NextResponse }
  | {
      ok: true
      userId: string
      supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>
      userEmail: string
    }

export async function requireStaffAutomationAccess(request: NextRequest): Promise<StaffAutomationAuthResult> {
  const serviceToken = extractAutomationServiceToken(request)
  const expectedServiceToken = process.env.AUTOMATION_SERVICE_TOKEN ?? ''

  if (tokensMatch(serviceToken, expectedServiceToken)) {
    const serviceUserId = request.headers.get(AUTOMATION_SERVICE_USER_HEADER)?.trim()
      || process.env.AUTOMATION_SERVICE_USER_ID
      || ''

    if (!serviceUserId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Automation service user is not configured' },
          { status: 500 },
        ),
      }
    }

    return {
      ok: true,
      userId: serviceUserId,
      supabase: createAdminClient(),
      userEmail: 'automation-service@system.local',
    }
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return { ok: false, response: auth.response }

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const userEmail = authData.user?.email ?? ''
  const staff = await getStaffMember(authData.user)

  if (!staff) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  if (!hasAdminHeaderAccess(staff)) {
    return { ok: false, response: NextResponse.json({ error: 'Admin role required' }, { status: 403 }) }
  }

  return { ok: true, userId: auth.userId, supabase, userEmail }
}
