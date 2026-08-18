import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isPartnerProgramId,
  isSponsorTemplateVariant,
  isWeeklySummaryDay,
  resolvePartnerProgramSettings,
  type PartnerProgramId,
  type SponsorTemplateVariant,
  type WeeklySummaryDay,
} from '@/lib/partner-program-settings'

type PartnerRow = {
  id: string
  email: string | null
  user_id: string | null
}

type PartnerProgramSettingsRow = {
  default_program: PartnerProgramId | null
  sponsor_template_variant: SponsorTemplateVariant | null
  cohort_naming_prefix: string | null
  weekly_summary_day: WeeklySummaryDay | null
}

type PartnerAuditAction =
  | 'settings_accessed'
  | 'program_settings_updated'
  | 'role_linked'

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

async function findPartner(admin: ReturnType<typeof createAdminClient>, userId: string, email: string | null): Promise<PartnerRow | null> {
  const { data: byUser } = await admin
    .from('partners')
    .select('id, email, user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (byUser) return byUser as PartnerRow
  if (!email) return null

  const { data: byEmail } = await admin
    .from('partners')
    .select('id, email, user_id')
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle()

  if (!byEmail) return null
  const partner = byEmail as PartnerRow

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

  const { data: rowRaw } = await admin
    .from('partner_program_settings')
    .select('default_program, sponsor_template_variant, cohort_naming_prefix, weekly_summary_day')
    .eq('partner_id', partner.id)
    .maybeSingle()
  const row = (rowRaw ?? null) as PartnerProgramSettingsRow | null

  const settings = resolvePartnerProgramSettings({
    defaultProgram: row?.default_program ?? undefined,
    sponsorTemplateVariant: row?.sponsor_template_variant ?? undefined,
    cohortNamingPrefix: row?.cohort_naming_prefix ?? undefined,
    weeklySummaryDay: row?.weekly_summary_day ?? undefined,
  })

  await writePartnerAuditEvent({
    admin,
    partnerId: partner.id,
    actorUserId: auth.userId,
    action: 'settings_accessed',
    details: { surface: 'team_program_settings_get' },
  })

  return withAuthCookies(NextResponse.json({ data: settings, partner: { id: partner.id } }), auth)
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

  const updates: Partial<PartnerProgramSettingsRow> = {}

  if (body?.defaultProgram !== undefined) {
    if (!isPartnerProgramId(body.defaultProgram)) {
      return withAuthCookies(NextResponse.json({ error: 'Invalid default program.' }, { status: 400 }), auth)
    }
    updates.default_program = body.defaultProgram
  }

  if (body?.sponsorTemplateVariant !== undefined) {
    if (!isSponsorTemplateVariant(body.sponsorTemplateVariant)) {
      return withAuthCookies(NextResponse.json({ error: 'Invalid sponsor template variant.' }, { status: 400 }), auth)
    }
    updates.sponsor_template_variant = body.sponsorTemplateVariant
  }

  if (body?.cohortNamingPrefix !== undefined) {
    if (body.cohortNamingPrefix !== null && typeof body.cohortNamingPrefix !== 'string') {
      return withAuthCookies(NextResponse.json({ error: 'Cohort naming prefix must be text.' }, { status: 400 }), auth)
    }
    updates.cohort_naming_prefix = body.cohortNamingPrefix?.trim() || null
  }

  if (body?.weeklySummaryDay !== undefined) {
    if (!isWeeklySummaryDay(body.weeklySummaryDay)) {
      return withAuthCookies(NextResponse.json({ error: 'Invalid weekly summary day.' }, { status: 400 }), auth)
    }
    updates.weekly_summary_day = body.weeklySummaryDay
  }

  if (Object.keys(updates).length === 0) {
    return withAuthCookies(NextResponse.json({ error: 'No program settings were provided.' }, { status: 400 }), auth)
  }

  const { error } = await admin
    .from('partner_program_settings')
    .upsert({ partner_id: partner.id, ...updates } as never, { onConflict: 'partner_id' })

  if (error) {
    Sentry.captureException(error, { extra: { route: 'team/program-settings', op: 'save', userId: auth.userId } })
    return withAuthCookies(NextResponse.json({ error: 'Failed to save program settings.' }, { status: 500 }), auth)
  }

  const { data: savedRaw } = await admin
    .from('partner_program_settings')
    .select('default_program, sponsor_template_variant, cohort_naming_prefix, weekly_summary_day')
    .eq('partner_id', partner.id)
    .maybeSingle()
  const saved = (savedRaw ?? null) as PartnerProgramSettingsRow | null

  await writePartnerAuditEvent({
    admin,
    partnerId: partner.id,
    actorUserId: auth.userId,
    action: 'program_settings_updated',
    details: { updated_fields: Object.keys(updates).sort() },
  })

  return withAuthCookies(NextResponse.json({
    ok: true,
    data: resolvePartnerProgramSettings({
      defaultProgram: saved?.default_program ?? undefined,
      sponsorTemplateVariant: saved?.sponsor_template_variant ?? undefined,
      cohortNamingPrefix: saved?.cohort_naming_prefix ?? undefined,
      weeklySummaryDay: saved?.weekly_summary_day ?? undefined,
    }),
  }), auth)
}
