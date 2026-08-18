 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { toPercent } from '@/lib/partner-kpi-schema'
import { isSponsorTemplateVariant, type SponsorTemplateVariant } from '@/lib/partner-program-settings'

type PartnerRow = {
  id: string
  name: string
  email: string
  is_active: boolean
  company: string | null
  notes: string | null
}

type AttributionRow = {
  partner_id: string
  signup_user_id: string
  attributed_at: string
}

function monthKey(referenceDate?: string): string {
  const d = referenceDate ? new Date(referenceDate) : new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function startOfMonthIso(key: string): string {
  return `${key}-01T00:00:00.000Z`
}

function endOfMonthIso(key: string): string {
  const [yearRaw, monthRaw] = key.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${key}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`
}

function mondayKey(isoDate: string): string {
  const d = new Date(isoDate)
  const day = d.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday))
  return monday.toISOString().slice(0, 10)
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escapeValue = (value: unknown) => {
    const raw = String(value ?? '')
    if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
      return `"${raw.replace(/"/g, '""')}"`
    }
    return raw
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(',')),
  ]
  return `${lines.join('\n')}\n`
}

type TemplateDefinition = {
  id: SponsorTemplateVariant
  label: string
  narrativeTone: string
  defaultSectionToggles: {
    showCohortBreakdown: boolean
    showWeeklyTrend: boolean
    showNarrativeSummary: boolean
  }
}

const TEMPLATE_LIBRARY: Record<SponsorTemplateVariant, TemplateDefinition> = {
  enterprise_board: {
    id: 'enterprise_board',
    label: 'Enterprise Board Review',
    narrativeTone: 'Board-facing summary with governance and risk visibility.',
    defaultSectionToggles: {
      showCohortBreakdown: true,
      showWeeklyTrend: true,
      showNarrativeSummary: true,
    },
  },
  growth_ops: {
    id: 'growth_ops',
    label: 'Growth Operations',
    narrativeTone: 'Operator-facing trend interpretation and action framing.',
    defaultSectionToggles: {
      showCohortBreakdown: true,
      showWeeklyTrend: true,
      showNarrativeSummary: true,
    },
  },
  pilot_compact: {
    id: 'pilot_compact',
    label: 'Pilot Compact',
    narrativeTone: 'Pilot-progress brief optimized for fast executive readouts.',
    defaultSectionToggles: {
      showCohortBreakdown: true,
      showWeeklyTrend: false,
      showNarrativeSummary: true,
    },
  },
}

type PartnerTemplateOverride = {
  templateVariant?: SponsorTemplateVariant
  brand?: {
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
    footerTagline?: string
  }
  sectionToggles?: {
    showCohortBreakdown?: boolean
    showWeeklyTrend?: boolean
    showNarrativeSummary?: boolean
  }
}

function isHexColor(value: string | undefined): value is string {
  return Boolean(value && /^#[0-9A-Fa-f]{6}$/.test(value))
}

function safeUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:') return parsed.toString()
    return null
  } catch {
    return null
  }
}

function parsePartnerTemplateOverride(notes: string | null): PartnerTemplateOverride {
  if (!notes) return {}

  const marker = 'SPONSOR_TEMPLATE_CONFIG:'
  const markerIndex = notes.indexOf(marker)
  if (markerIndex === -1) return {}

  const raw = notes.slice(markerIndex + marker.length).trim()
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as PartnerTemplateOverride
    return parsed ?? {}
  } catch {
    return {}
  }
}

function inferTemplateVariant(partner: PartnerRow, override: PartnerTemplateOverride): SponsorTemplateVariant {
  if (override.templateVariant && TEMPLATE_LIBRARY[override.templateVariant]) {
    return override.templateVariant
  }

  const text = `${partner.name} ${partner.company ?? ''}`.toLowerCase()
  if (text.includes('enterprise') || text.includes('board')) return 'enterprise_board'
  if (text.includes('pilot') || text.includes('outplacement')) return 'pilot_compact'
  return 'growth_ops'
}

function resolveBrandConfig(partner: PartnerRow, override: PartnerTemplateOverride) {
  const brand = override.brand ?? {}
  return {
    displayName: partner.company?.trim() || partner.name,
    logoUrl: safeUrl(brand.logoUrl),
    primaryColor: isHexColor(brand.primaryColor) ? brand.primaryColor : '#0f172a',
    accentColor: isHexColor(brand.accentColor) ? brand.accentColor : '#f97316',
    footerTagline: typeof brand.footerTagline === 'string' && brand.footerTagline.trim().length > 0
      ? brand.footerTagline.trim()
      : 'Confidential sponsor reporting pack',
  }
}

function resolveSectionToggles(
  definition: TemplateDefinition,
  override: PartnerTemplateOverride,
) {
  const toggles = override.sectionToggles ?? {}
  return {
    showCohortBreakdown: toggles.showCohortBreakdown ?? definition.defaultSectionToggles.showCohortBreakdown,
    showWeeklyTrend: toggles.showWeeklyTrend ?? definition.defaultSectionToggles.showWeeklyTrend,
    showNarrativeSummary: toggles.showNarrativeSummary ?? definition.defaultSectionToggles.showNarrativeSummary,
  }
}

function buildPdfHtml(args: {
  partnerName: string
  brandDisplayName: string
  monthKeyValue: string
  templateDefinition: TemplateDefinition
  sectionToggles: {
    showCohortBreakdown: boolean
    showWeeklyTrend: boolean
    showNarrativeSummary: boolean
  }
  brand: {
    logoUrl: string | null
    primaryColor: string
    accentColor: string
    footerTagline: string
  }
  totals: {
    usersInScope: number
    utilizationRate: number
    prepCompletionRate: number
    pipelineMovementRate: number
  }
  cohortRows: Array<{ cohort: string; users_in_scope: number; utilization_rate: number; prep_completion_rate: number; pipeline_movement_rate: number }>
  weeklyRows: Array<{ week_start: string; active_users: number; prep_users: number; outreach_users: number }>
}): string {
  const cohortTable = args.cohortRows.map((row) => (
    `<tr>
      <td>${row.cohort}</td>
      <td>${row.users_in_scope}</td>
      <td>${row.utilization_rate.toFixed(2)}%</td>
      <td>${row.prep_completion_rate.toFixed(2)}%</td>
      <td>${row.pipeline_movement_rate.toFixed(2)}%</td>
    </tr>`
  )).join('\n')

  const weeklyTable = args.weeklyRows.map((row) => (
    `<tr>
      <td>${row.week_start}</td>
      <td>${row.active_users}</td>
      <td>${row.prep_users}</td>
      <td>${row.outreach_users}</td>
    </tr>`
  )).join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sponsor Report Pack - ${args.partnerName}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    h2 { font-size: 14px; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
    .label { font-size: 11px; color: #64748b; }
    .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px; font-size: 12px; text-align: left; }
    th { background: #f8fafc; }
    .header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .brand { font-size: 12px; color: #475569; }
    .tone { margin-top: 4px; font-size: 12px; color: #334155; }
    .narrative { margin-top: 12px; border-left: 4px solid ${args.brand.accentColor}; background: #f8fafc; padding: 10px 12px; font-size: 12px; color: #334155; }
    .footer { margin-top: 20px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: ${args.brand.accentColor}; margin-right: 6px; }
  </style>
</head>
<body>
  <div class="header-row">
    <div>
      <h1 style="color:${args.brand.primaryColor}">${args.partnerName} Sponsor Report Pack</h1>
      <div class="brand">Brand: ${args.brandDisplayName}</div>
      <div class="tone"><span class="dot"></span>${args.templateDefinition.label} - ${args.templateDefinition.narrativeTone}</div>
    </div>
    ${args.brand.logoUrl ? `<img src="${args.brand.logoUrl}" alt="brand logo" style="max-height:42px; max-width:120px; object-fit:contain;"/>` : ''}
  </div>
  <p>Month: ${args.monthKeyValue}</p>
  ${args.sectionToggles.showNarrativeSummary ? `<div class="narrative">This sponsor report is configured for ${args.templateDefinition.label.toLowerCase()} review. Metrics are scoped to partner-attributed participants only and formatted for executive readability.</div>` : ''}
  <h2>Utilization and Trend Summary</h2>
  <div class="cards">
    <div class="card"><div class="label">Users in scope</div><div class="value">${args.totals.usersInScope}</div></div>
    <div class="card"><div class="label">Utilization</div><div class="value">${args.totals.utilizationRate.toFixed(2)}%</div></div>
    <div class="card"><div class="label">Prep completion</div><div class="value">${args.totals.prepCompletionRate.toFixed(2)}%</div></div>
    <div class="card"><div class="label">Pipeline movement</div><div class="value">${args.totals.pipelineMovementRate.toFixed(2)}%</div></div>
  </div>

  ${args.sectionToggles.showCohortBreakdown ? `<h2>Cohort Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Cohort</th>
        <th>Users</th>
        <th>Utilization</th>
        <th>Prep completion</th>
        <th>Pipeline movement</th>
      </tr>
    </thead>
    <tbody>
      ${cohortTable || '<tr><td colspan="5">No cohort rows available.</td></tr>'}
    </tbody>
  </table>` : ''}

  ${args.sectionToggles.showWeeklyTrend ? `<h2>Weekly Trend</h2>
  <table>
    <thead>
      <tr>
        <th>Week start</th>
        <th>Active users</th>
        <th>Prep users</th>
        <th>Outreach users</th>
      </tr>
    </thead>
    <tbody>
      ${weeklyTable || '<tr><td colspan="4">No weekly trend rows available.</td></tr>'}
    </tbody>
  </table>` : ''}
  <div class="footer">${args.brand.footerTagline}</div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)
  const body = await request.json().catch(() => ({}))

  const key = monthKey(body?.referenceDate)
  const monthStartIso = startOfMonthIso(key)
  const monthEndIso = endOfMonthIso(key)
  const retryPartnerId = typeof body?.retryPartnerId === 'string' ? body.retryPartnerId : null

  const partnersRes = await sb
    .from('partners')
    .select('id,name,email,is_active,company,notes')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const partners = ((partnersRes.data ?? []) as PartnerRow[])
    .filter((partner) => !retryPartnerId || partner.id === retryPartnerId)

  const attributionsRes = await sb
    .from('referral_attributions')
    .select('partner_id,signup_user_id,attributed_at')
    .in('partner_id', partners.map((partner) => partner.id))

  const attributions = (attributionsRes.data ?? []) as AttributionRow[]
  const results: Array<Record<string, unknown>> = []
  const failures: Array<{ partner_id: string; partner_name: string; reason: string }> = []

  for (const partner of partners) {
    try {
      const partnerUserIds = Array.from(
        new Set(
          attributions
            .filter((row) => row.partner_id === partner.id)
            .map((row) => row.signup_user_id),
        ),
      )

      if (partnerUserIds.length === 0) {
        throw new Error('No attributed users for partner in scope')
      }

      const [eventsRes, prepRes, outreachRes] = await Promise.all([
        sb
          .from('user_events')
          .select('user_id,created_at')
          .in('user_id', partnerUserIds)
          .gte('created_at', monthStartIso)
          .lte('created_at', monthEndIso)
          .limit(100000),
        sb
          .from('briefs')
          .select('user_id,created_at,type')
          .in('user_id', partnerUserIds)
          .in('type', ['prep', 'prep_section'])
          .gte('created_at', monthStartIso)
          .lte('created_at', monthEndIso)
          .limit(100000),
        sb
          .from('outreach_logs')
          .select('user_id,sent_at')
          .in('user_id', partnerUserIds)
          .gte('sent_at', monthStartIso)
          .lte('sent_at', monthEndIso)
          .limit(100000),
      ])

      const eventRows = (eventsRes.data ?? []) as Array<{ user_id: string; created_at: string }>
      const prepRows = (prepRes.data ?? []) as Array<{ user_id: string; created_at: string }>
      const outreachRows = (outreachRes.data ?? []) as Array<{ user_id: string; sent_at: string }>

      const activeUsers = new Set(eventRows.map((row) => row.user_id))
      const prepUsers = new Set(prepRows.map((row) => row.user_id))
      const movementUsers = new Set(outreachRows.map((row) => row.user_id))

      const totals = {
        usersInScope: partnerUserIds.length,
        utilizationRate: toPercent(activeUsers.size, partnerUserIds.length),
        prepCompletionRate: toPercent(prepUsers.size, partnerUserIds.length),
        pipelineMovementRate: toPercent(movementUsers.size, partnerUserIds.length),
      }

      const cohortMap = new Map<string, string[]>()
      for (const row of attributions.filter((item) => item.partner_id === partner.id)) {
        const cohort = row.attributed_at.slice(0, 7)
        const existing = cohortMap.get(cohort)
        if (existing) existing.push(row.signup_user_id)
        else cohortMap.set(cohort, [row.signup_user_id])
      }

      const cohortRows = Array.from(cohortMap.entries())
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([cohort, ids]) => {
          const idSet = new Set(ids)
          const active = new Set(eventRows.filter((row) => idSet.has(row.user_id)).map((row) => row.user_id))
          const prep = new Set(prepRows.filter((row) => idSet.has(row.user_id)).map((row) => row.user_id))
          const movement = new Set(outreachRows.filter((row) => idSet.has(row.user_id)).map((row) => row.user_id))
          return {
            cohort,
            users_in_scope: idSet.size,
            utilization_rate: toPercent(active.size, idSet.size),
            prep_completion_rate: toPercent(prep.size, idSet.size),
            pipeline_movement_rate: toPercent(movement.size, idSet.size),
          }
        })

      const weeklyMap = new Map<string, { activeUsers: Set<string>; prepUsers: Set<string>; outreachUsers: Set<string> }>()
      for (const row of eventRows) {
        const week = mondayKey(row.created_at)
        const current = weeklyMap.get(week) ?? { activeUsers: new Set(), prepUsers: new Set(), outreachUsers: new Set() }
        current.activeUsers.add(row.user_id)
        weeklyMap.set(week, current)
      }
      for (const row of prepRows) {
        const week = mondayKey(row.created_at)
        const current = weeklyMap.get(week) ?? { activeUsers: new Set(), prepUsers: new Set(), outreachUsers: new Set() }
        current.prepUsers.add(row.user_id)
        weeklyMap.set(week, current)
      }
      for (const row of outreachRows) {
        const week = mondayKey(row.sent_at)
        const current = weeklyMap.get(week) ?? { activeUsers: new Set(), prepUsers: new Set(), outreachUsers: new Set() }
        current.outreachUsers.add(row.user_id)
        weeklyMap.set(week, current)
      }

      const weeklyRows = Array.from(weeklyMap.entries())
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([week, values]) => ({
          week_start: week,
          active_users: values.activeUsers.size,
          prep_users: values.prepUsers.size,
          outreach_users: values.outreachUsers.size,
        }))

      const csvRows = weeklyRows.map((row) => ({
        partner_id: partner.id,
        partner_name: partner.name,
        month_key: key,
        ...row,
      }))

      const templateOverride = parsePartnerTemplateOverride(partner.notes)
      const settingsRes = await sb
        .from('partner_program_settings')
        .select('sponsor_template_variant')
        .eq('partner_id', partner.id)
        .maybeSingle()

      const settingsVariant = settingsRes.data?.sponsor_template_variant
      const templateVariant = isSponsorTemplateVariant(settingsVariant)
        ? settingsVariant
        : inferTemplateVariant(partner, templateOverride)
      const templateDefinition = TEMPLATE_LIBRARY[templateVariant]
      const brand = resolveBrandConfig(partner, templateOverride)
      const sectionToggles = resolveSectionToggles(templateDefinition, templateOverride)

      const csvText = toCsv(csvRows)
      const pdfHtml = buildPdfHtml({
        partnerName: partner.name,
        brandDisplayName: brand.displayName,
        monthKeyValue: key,
        templateDefinition,
        sectionToggles,
        brand,
        totals,
        cohortRows,
        weeklyRows,
      })

      const exportPayload = {
        ticket: 'PB-Q1-004',
        partner_id: partner.id,
        partner_name: partner.name,
        month_key: key,
        generated_at: new Date().toISOString(),
        template: {
          variant: templateVariant,
          label: templateDefinition.label,
          library_size: Object.keys(TEMPLATE_LIBRARY).length,
        },
        branding: brand,
        section_toggles: sectionToggles,
        sections: {
          cohort_breakdown: cohortRows,
          utilization_summary: totals,
          trend_rows: weeklyRows,
        },
        formats: {
          csv: {
            file_name: `sponsor-pack-${partner.id}-${key}.csv`,
            content_type: 'text/csv',
            content: csvText,
          },
          pdf: {
            file_name: `sponsor-pack-${partner.id}-${key}.pdf`,
            content_type: 'application/pdf',
            render_source: 'html',
            html: pdfHtml,
          },
        },
        access_controls: {
          scoped_partner_id: partner.id,
          attributed_user_count: partnerUserIds.length,
          boundary_rule: 'All metrics derived only from referral_attributions scoped to this partner.',
        },
      }

      await sb
        .from('monthly_business_review_runs')
        .insert({
          user_id: userId,
          month_key: key,
          review_payload: exportPayload,
        })

      results.push({
        partner_id: partner.id,
        partner_name: partner.name,
        month_key: key,
        status: 'ok',
        files: {
          csv: `sponsor-pack-${partner.id}-${key}.csv`,
          pdf: `sponsor-pack-${partner.id}-${key}.pdf`,
        },
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown export failure'
      failures.push({ partner_id: partner.id, partner_name: partner.name, reason })
      await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'monthly_business_review_runs',
        alert_code: 'sponsor_export_pipeline_failure',
        severity: 'high',
        message: `Sponsor export failed for ${partner.name}: ${reason}`,
        status: 'open',
      })
    }
  }

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q1-005',
    month_key: key,
    template_library: Object.values(TEMPLATE_LIBRARY).map((item) => ({
      id: item.id,
      label: item.label,
      narrative_tone: item.narrativeTone,
      default_section_toggles: item.defaultSectionToggles,
    })),
    schedule: {
      cadence: 'monthly',
      recommended_cron_utc: '0 9 1 * *',
      job_name: 'sponsor-export-pipeline-monthly',
    },
    created_formats: {
      csv: true,
      pdf: true,
    },
    exports: results,
    failures,
    retry: {
      endpoint: '/api/admin/automation/reporting/sponsor-export-pipeline',
      method: 'POST',
      body_template: {
        referenceDate: `${key}-01`,
        retryPartnerId: failures[0]?.partner_id ?? null,
      },
    },
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
