import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canUserSeeAdminHeader } from '@/lib/staff'
import { TeamSettings } from './team-settings'
import { ClientCoachAccessManager } from '@/app/(dashboard)/settings/_components/coach-access-manager'
import { resolveWhiteLabelSettings } from '@/lib/white-label'
import {
  resolvePartnerProgramSettings,
  type PartnerProgramId,
  type SponsorTemplateVariant,
  type WeeklySummaryDay,
} from '@/lib/partner-program-settings'

export const metadata = { title: 'Team - Starting Monday' }

type SeatStatus = {
  profileDone: boolean
  companyAdded: boolean
  briefGenerated: boolean
}

type PartnerProgramSettingsRow = {
  default_program: PartnerProgramId | null
  sponsor_template_variant: SponsorTemplateVariant | null
  cohort_naming_prefix: string | null
  weekly_summary_day: WeeklySummaryDay | null
}

type PartnerWithWhiteLabelRow = {
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

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const isRothschildAdmin = await canUserSeeAdminHeader(user.email ?? '')
  const admin = createAdminClient()

  const { data: partnerRowRaw } = await admin
    .from('partners')
    .select('id, name, email, user_id, white_label_brand_name, white_label_track_id, white_label_tier_id, white_label_primary_color, white_label_accent_color, white_label_support_email, white_label_logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  const partnerRow = (partnerRowRaw ?? null) as PartnerWithWhiteLabelRow | null
  let partner = partnerRow
  if (!partner && user.email) {
    const { data: partnerByEmailRaw } = await admin
      .from('partners')
      .select('id, name, email, user_id, white_label_brand_name, white_label_track_id, white_label_tier_id, white_label_primary_color, white_label_accent_color, white_label_support_email, white_label_logo_url')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle()
    partner = (partnerByEmailRaw ?? null) as PartnerWithWhiteLabelRow | null
    if (partner && !partner.user_id) {
      await admin.from('partners').update({ user_id: user.id }).eq('id', partner.id)
      partner.user_id = user.id
    }
  }

  const { data: rawSeats } = await supabase
    .from('team_seats')
    .select('id, member_email, member_user_id, status, invited_at, accepted_at')
    .eq('owner_id', user.id)
    .order('invited_at', { ascending: false })

  const seats = rawSeats ?? []

  const { data: programSettingsRowRaw } = partner
    ? await admin
      .from('partner_program_settings')
      .select('default_program, sponsor_template_variant, cohort_naming_prefix, weekly_summary_day')
      .eq('partner_id', partner.id)
      .maybeSingle()
    : { data: null }
  const programSettingsRow = (programSettingsRowRaw ?? null) as PartnerProgramSettingsRow | null

  // Compute activation status for accepted seats
  const seatStatuses: Record<string, SeatStatus> = {}

  await Promise.all(
    seats
      .filter(s => s.status === 'accepted' && s.member_user_id)
      .map(async (s) => {
        const [{ data: profile }, { count: companyCount }, { count: briefCount }] = await Promise.all([
          admin.from('user_profiles').select('role_type, full_name').eq('user_id', s.member_user_id!).single(),
          admin.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', s.member_user_id!).is('archived_at', null),
          admin.from('briefs').select('id', { count: 'exact', head: true }).eq('user_id', s.member_user_id!),
        ])
        seatStatuses[s.id] = {
          profileDone: !!(profile?.role_type && profile?.full_name),
          companyAdded: (companyCount ?? 0) > 0,
          briefGenerated: (briefCount ?? 0) > 0,
        }
      })
  )

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              &larr; Dashboard
            </Link>
            {isRothschildAdmin && (
              <Link href="/dashboard/admin" className="text-[12px] font-semibold text-primary transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground">Team</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Invite members and track their search activation.
          </p>
        </div>

        <TeamSettings
          whiteLabel={partner ? resolveWhiteLabelSettings({
            brandName: partner.white_label_brand_name ?? undefined,
            trackId: (partner.white_label_track_id ?? undefined) as 'executive_transition' | 'professional_transition' | undefined,
            tierId: (partner.white_label_tier_id ?? undefined) as 'solo' | 'boutique' | 'outplacement' | undefined,
            primaryColor: partner.white_label_primary_color ?? undefined,
            accentColor: partner.white_label_accent_color ?? undefined,
            supportEmail: partner.white_label_support_email ?? undefined,
            logoUrl: partner.white_label_logo_url,
            fallbackBrandName: partner.name,
            fallbackSupportEmail: partner.email,
          }) : null}
          programSettings={partner ? resolvePartnerProgramSettings({
            defaultProgram: programSettingsRow?.default_program ?? undefined,
            sponsorTemplateVariant: programSettingsRow?.sponsor_template_variant ?? undefined,
            cohortNamingPrefix: programSettingsRow?.cohort_naming_prefix ?? undefined,
            weeklySummaryDay: programSettingsRow?.weekly_summary_day ?? undefined,
          }) : null}
          seats={seats.map(s => ({
            id: s.id,
            member_email: s.member_email,
            member_user_id: s.member_user_id ?? null,
            status: s.status as 'pending' | 'accepted',
            invited_at: s.invited_at,
            accepted_at: s.accepted_at ?? null,
            seatStatus: seatStatuses[s.id] ?? null,
          }))}
        />

        <div className="mt-8">
          <ClientCoachAccessManager />
        </div>
      </main>
    </div>
  )
}

