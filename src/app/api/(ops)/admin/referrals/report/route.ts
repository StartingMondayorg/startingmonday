import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'

type ReferralUserRow = {
  id: string
  created_at: string
  referral_source: string | null
  signup_source: string | null
  acquisition_channel: string | null
}

type ReferralAttributionRow = {
  signup_user_id: string
  partner_id: string
}

type UserProfileReferralRow = {
  user_id: string
  referred_by: string | null
  referred_by_name: string | null
  referred_by_company: string | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const adminAny = admin as any
  const lookbackDaysRaw = Number(request.nextUrl.searchParams.get('lookbackDays') ?? '30')
  const lookbackDays = Number.isFinite(lookbackDaysRaw) ? Math.min(Math.max(Math.round(lookbackDaysRaw), 1), 365) : 30
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: users }, { data: attributions }] = await Promise.all([
    adminAny
      .from('users')
      .select('id, created_at, referral_source, signup_source, acquisition_channel')
      .gte('created_at', sinceIso)
      .limit(5000),
    adminAny
      .from('referral_attributions')
      .select('signup_user_id, partner_id')
      .limit(5000),
  ])

  const referralUsers = ((users ?? []) as ReferralUserRow[])
    .filter((row) => typeof row.referral_source === 'string' && row.referral_source.trim().length > 0)

  const referralUserIds = referralUsers.map((row) => row.id)
  const attributionRows = (attributions ?? []) as ReferralAttributionRow[]
  const attributedUserIds = new Set(attributionRows.map((row) => row.signup_user_id))

  let profileRows: UserProfileReferralRow[] = []
  if (referralUserIds.length > 0) {
    const { data: profiles } = await adminAny
      .from('user_profiles')
      .select('user_id, referred_by, referred_by_name, referred_by_company')
      .in('user_id', referralUserIds)
      .limit(5000)
    profileRows = (profiles ?? []) as UserProfileReferralRow[]
  }
  const profileByUser = new Map(profileRows.map((row) => [
    row.user_id,
    {
      referred_by: row.referred_by,
      referred_by_name: row.referred_by_name,
      referred_by_company: row.referred_by_company,
    },
  ]))

  const partnerIds = [...new Set(attributionRows.map((row) => row.partner_id))]
  let partnerById = new Map<string, { name: string | null; referral_code: string | null }>()
  if (partnerIds.length > 0) {
    const { data: partnersData } = await adminAny
      .from('partners')
      .select('id, name, referral_code')
      .in('id', partnerIds)
      .limit(5000)
    partnerById = new Map((partnersData ?? []).map((row: { id: string; name: string | null; referral_code: string | null }) => [
      row.id,
      { name: row.name, referral_code: row.referral_code },
    ]))
  }

  const missingAttribution = referralUsers.filter((row) => !attributedUserIds.has(row.id))
  const profileReferralSetCount = referralUsers.filter((row) => {
    const referredBy = profileByUser.get(row.id)?.referred_by
    return typeof referredBy === 'string' && referredBy.trim().length > 0
  }).length

  const referralUserById = new Map(referralUsers.map((row) => [row.id, row]))
  const recentAttributions = attributionRows
    .sort((a, b) => {
      const aCreated = referralUserById.get(a.signup_user_id)?.created_at ?? ''
      const bCreated = referralUserById.get(b.signup_user_id)?.created_at ?? ''
      return Date.parse(bCreated) - Date.parse(aCreated)
    })
    .slice(0, 25)
    .map((row) => {
      const userRow = referralUserById.get(row.signup_user_id)
      const partner = partnerById.get(row.partner_id)
      return {
        created_at: userRow?.created_at ?? null,
        signup_user_id: row.signup_user_id,
        partner_id: row.partner_id,
        partner_name: partner?.name ?? null,
        partner_referral_code: partner?.referral_code ?? null,
        referral_source: userRow?.referral_source ?? null,
        signup_source: userRow?.signup_source ?? null,
        acquisition_channel: userRow?.acquisition_channel ?? null,
        profile_referred_by: profileByUser.get(row.signup_user_id)?.referred_by ?? null,
        profile_referred_by_name: profileByUser.get(row.signup_user_id)?.referred_by_name ?? null,
        profile_referred_by_company: profileByUser.get(row.signup_user_id)?.referred_by_company ?? null,
      }
    })

  return NextResponse.json({
    lookbackDays,
    windowStart: sinceIso,
    counts: {
      referral_source_users: referralUsers.length,
      attributed_users: referralUsers.length - missingAttribution.length,
      missing_attribution_users: missingAttribution.length,
      profile_referred_by_users: profileReferralSetCount,
    },
    missingAttributionUsers: missingAttribution.slice(0, 50).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      referral_source: row.referral_source,
      signup_source: row.signup_source,
      acquisition_channel: row.acquisition_channel,
      profile_referred_by: profileByUser.get(row.id)?.referred_by ?? null,
      profile_referred_by_name: profileByUser.get(row.id)?.referred_by_name ?? null,
      profile_referred_by_company: profileByUser.get(row.id)?.referred_by_company ?? null,
    })),
    recentAttributions,
  })
}
