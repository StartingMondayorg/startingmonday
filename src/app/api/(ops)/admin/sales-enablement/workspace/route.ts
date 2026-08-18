import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'

const WORKSPACE_KEY = 'sales_enablement'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function requireStaff(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return { ok: false as const, response: auth.response }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { ok: true as const, auth, user, staff }
}

export async function GET(request: NextRequest) {
  const gate = await requireStaff(request)
  if (!gate.ok) return gate.response

  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('admin_shared_workspaces')
    .select('workspace_state, updated_at, updated_by')
    .eq('workspace_key', WORKSPACE_KEY)
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'admin/sales-enablement/workspace', op: 'load' } })
    return withAuthCookies(NextResponse.json({ error: error.message }, { status: 500 }), gate.auth)
  }

  return withAuthCookies(NextResponse.json({
    workspace: data?.workspace_state ?? null,
    updatedAt: data?.updated_at ?? null,
    updatedBy: data?.updated_by ?? null,
    role: gate.staff.role,
  }), gate.auth)
}

export async function PUT(request: NextRequest) {
  const gate = await requireStaff(request)
  if (!gate.ok) return gate.response

  if (gate.staff.role === 'viewer') {
    return withAuthCookies(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), gate.auth)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return withAuthCookies(NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }), gate.auth)
  }

  const workspace = isObject(body) ? body.workspace : null
  if (!isObject(workspace)) {
    return withAuthCookies(NextResponse.json({ error: 'workspace must be an object' }, { status: 400 }), gate.auth)
  }

  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('admin_shared_workspaces')
    .upsert({
      workspace_key: WORKSPACE_KEY,
      workspace_state: workspace,
      updated_by: gate.user.email ?? null,
    }, { onConflict: 'workspace_key' })
    .select('workspace_state, updated_at, updated_by')
    .single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'admin/sales-enablement/workspace', op: 'save' } })
    return withAuthCookies(NextResponse.json({ error: error.message }, { status: 500 }), gate.auth)
  }

  return withAuthCookies(NextResponse.json({
    ok: true,
    workspace: data.workspace_state,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  }), gate.auth)
}
