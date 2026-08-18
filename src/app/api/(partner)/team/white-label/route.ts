import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  WHITE_LABEL_TRACKS,
  WHITE_LABEL_TIERS,
  resolveWhiteLabelSettings,
  type WhiteLabelTierId,
  type WhiteLabelTrackId,
} from '@/lib/white-label'

type PartnerRow = {
  id: string
  name: string
  email: string | null
  user_id: string | null
  white_label_brand_name: string | null
  white_label_track_id: string | null
  white_label_tier_id: string | null
  white_label_primary_color: string | null
  white_label_accent_color: string | null
  white_label_support_email: string | null
  white_label_logo_url: string | null
}

type PartnerAuditAction =
  | 'settings_accessed'
  | 'white_label_updated'
  | 'role_linked'

const PARTNER_FIELDS = 'id, name, email, user_id, white_label_brand_name, white_label_track_id, white_label_tier_id, white_label_primary_color, white_label_accent_color, white_label_support_email, white_label_logo_url'

async function writePartnerAuditEvent(args: {
  admin: ReturnType<typeof createAdminClient>
  partnerId: string
  actorUserId: string
  action: PartnerAuditAction
  details?: Record<string, unknown>
}) {
  await args.admin
    .from('partner_audit_events' as never)
    .insert({
      partner_id: args.partnerId,
      actor_user_id: args.actorUserId,
      action: args.action,
      details: args.details ?? {},
    } as never)
}

function isWhiteLabelTrackId(value: unknown): value is WhiteLabelTrackId {
  return typeof value === 'string' && WHITE_LABEL_TRACKS.some((track) => track.id === value)
}

function isWhiteLabelTierId(value: unknown): value is WhiteLabelTierId {
  return typeof value === 'string' && WHITE_LABEL_TIERS.some((tier) => tier.id === value)
}

function parseText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseColor(value: unknown): string | null | undefined {
  const parsed = parseText(value)
  if (parsed === undefined || parsed === null) return parsed
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(parsed) ? parsed.toLowerCase() : undefined
}

function partnerToSettings(partner: PartnerRow) {
  return resolveWhiteLabelSettings({
    brandName: partner.white_label_brand_name ?? undefined,
    trackId: (partner.white_label_track_id ?? undefined) as WhiteLabelTrackId | undefined,
    tierId: (partner.white_label_tier_id ?? undefined) as WhiteLabelTierId | undefined,
    primaryColor: partner.white_label_primary_color ?? undefined,
    accentColor: partner.white_label_accent_color ?? undefined,
    supportEmail: partner.white_label_support_email ?? undefined,
    logoUrl: partner.white_label_logo_url,
    fallbackBrandName: partner.name,
    fallbackSupportEmail: partner.email,
  })
}

async function findPartner(admin: ReturnType<typeof createAdminClient>, userId: string, email: string | null): Promise<PartnerRow | null> {
  const { data: byUser } = await admin
    .from('partners')
    .select(PARTNER_FIELDS)
    .eq('user_id', userId)
    .maybeSingle()

  if (byUser) return byUser as unknown as PartnerRow
  if (!email) return null

  const { data: byEmail } = await admin
    .from('partners')
    .select(PARTNER_FIELDS)
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle()

  if (!byEmail) return null

  const partner = byEmail as unknown as PartnerRow
  if (!partner.user_id) {
    await admin.from('partners').update({ user_id: userId }).eq('id', partner.id)
    partner.user_id = userId
    await writePartnerAuditEvent({
      admin,
      partnerId: partner.id,
      actorUserId: userId,
      action: 'role_linked',
      details: { link_reason: 'email_match_backfill' },
    })
  }

  return partner
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  await writePartnerAuditEvent({
    admin,
    partnerId: partner.id,
    actorUserId: auth.userId,
    action: 'settings_accessed',
    details: { surface: 'team_white_label_get' },
  })

  return withAuthCookies(NextResponse.json({ data: partnerToSettings(partner), partner: { id: partner.id, name: partner.name } }), auth)
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  const updates: Record<string, string | null> = {}

  if (body?.brandName !== undefined) {
    const parsed = parseText(body.brandName)
    if (parsed === undefined) return withAuthCookies(NextResponse.json({ error: 'Brand name must be text.' }, { status: 400 }), auth)
    updates.white_label_brand_name = parsed
  }

  if (body?.trackId !== undefined) {
    if (!isWhiteLabelTrackId(body.trackId)) {
      return withAuthCookies(NextResponse.json({ error: 'Invalid track.' }, { status: 400 }), auth)
    }
    updates.white_label_track_id = body.trackId
  }

  if (body?.tierId !== undefined) {
    if (!isWhiteLabelTierId(body.tierId)) {
      return withAuthCookies(NextResponse.json({ error: 'Invalid tier.' }, { status: 400 }), auth)
    }
    updates.white_label_tier_id = body.tierId
  }

  if (body?.primaryColor !== undefined) {
    const parsed = parseColor(body.primaryColor)
    if (parsed === undefined) return withAuthCookies(NextResponse.json({ error: 'Primary color must be a hex color like #0f172a.' }, { status: 400 }), auth)
    updates.white_label_primary_color = parsed
  }

  if (body?.accentColor !== undefined) {
    const parsed = parseColor(body.accentColor)
    if (parsed === undefined) return withAuthCookies(NextResponse.json({ error: 'Accent color must be a hex color like #f97316.' }, { status: 400 }), auth)
    updates.white_label_accent_color = parsed
  }

  if (body?.supportEmail !== undefined) {
    const parsed = parseText(body.supportEmail)
    if (parsed === undefined) return withAuthCookies(NextResponse.json({ error: 'Support email must be text.' }, { status: 400 }), auth)
    updates.white_label_support_email = parsed
  }

  if (body?.logoUrl !== undefined) {
    if (body.logoUrl === null) {
      updates.white_label_logo_url = null
    } else {
      const parsed = parseText(body.logoUrl)
      if (parsed === undefined) return withAuthCookies(NextResponse.json({ error: 'Logo URL must be text.' }, { status: 400 }), auth)
      updates.white_label_logo_url = parsed
    }
  }

  if (Object.keys(updates).length === 0) {
    return withAuthCookies(NextResponse.json({ error: 'No white-label fields were provided.' }, { status: 400 }), auth)
  }

  const { error } = await admin.from('partners').update(updates).eq('id', partner.id)
  if (error) {
    Sentry.captureException(error, { extra: { route: 'team/white-label', op: 'save', userId: auth.userId } })
    return withAuthCookies(NextResponse.json({ error: 'Failed to save white-label settings.' }, { status: 500 }), auth)
  }

  const refreshed = {
    ...partner,
    ...updates,
  }

  await writePartnerAuditEvent({
    admin,
    partnerId: partner.id,
    actorUserId: auth.userId,
    action: 'white_label_updated',
    details: { updated_fields: Object.keys(updates).sort() },
  })

  return withAuthCookies(NextResponse.json({
    ok: true,
    data: partnerToSettings(refreshed as PartnerRow),
  }), auth)
}
