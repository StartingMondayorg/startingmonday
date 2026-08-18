import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  computePersonaRelevance,
  computeSignalConfidence,
  enrichSignalProfileContext,
} from '@/lib/intelligence-quality'

const VACANCY_WINDOW_DAYS = 365
const MIN_CONFIDENCE = 55
const EXEC_TITLE_REGEX = /\b(chief|ceo|cio|cto|ciso|cdo|coo|cpo|president|evp|svp|vp)\b/i

const TITLE_LABEL: Record<string, string> = {
  CIO: 'CIO', CTO: 'CTO', CISO: 'CISO',
  CDO_DATA: 'CDO (Data)', CDO_DIGITAL: 'CDO (Digital)',
  COO: 'COO', CPO: 'CPO',
  VP_TECH: 'VP of Technology', OTHER_C: 'C-suite executive',
}

const DEPARTURE_LABEL: Record<string, string> = {
  voluntary: 'voluntary departure',
  forced: 'abrupt departure',
  retirement: 'retirement',
  acquisition: 'acquisition-related departure',
  internal_promotion: 'internal promotion',
}

type PipelineCompany = {
  id: string
  name: string
  user_id: string
  sec_cik: string
}

type Departure = {
  company_cik: string | null
  title: string
  title_normalized: string | null
  end_date: string | null
  departure_type: string | null
  sec_accession_number: string | null
}

type CurrentExec = {
  company_cik: string | null
  title_normalized: string | null
}

type ExistingSignal = {
  company_id: string
  source_url: string | null
}

type UserProfile = {
  user_id: string
  role_type: string | null
  search_persona: string | null
  role_family: string | null
  role_title: string | null
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const windowCutoff = new Date(Date.now() - VACANCY_WINDOW_DAYS * 86_400_000)
    .toISOString().slice(0, 10)

  // All active pipeline companies with a resolved CIK.
  // Cast needed: sec_cik was added via migration and is not in the generated types file.
  const { data: rawCompanies, error: compErr } = await admin
    .from('companies')
    .select('id, name, user_id, sec_cik')
    .not('sec_cik', 'is', null)
    .is('archived_at', null)

  if (compErr) {
    Sentry.captureException(compErr, { extra: { route: 'cron/edgar-signals' } })
    return NextResponse.json({ error: compErr.message }, { status: 500 })
  }
  const companies = (rawCompanies ?? []) as unknown as PipelineCompany[]
  const companiesWithValidCik = companies.filter((company) => /^\d{10}$/.test(company.sec_cik))
  if (!companiesWithValidCik.length) return NextResponse.json({ checked: 0, inserted: 0 })

  const ciks = [...new Set(companiesWithValidCik.map(c => c.sec_cik))]

  // Departures in the window for those CIKs.
  // executive_positions is an admin-only table not included in database.types.ts.
  const { data: rawDepartures, error: depErr } = await admin
    .from('executive_positions')
    .select('company_cik, title, title_normalized, end_date, departure_type, sec_accession_number')
    .in('company_cik', ciks)
    .eq('is_current', false)
    .gte('end_date', windowCutoff)
    .not('title_normalized', 'is', null)

  if (depErr) {
    Sentry.captureException(depErr, { extra: { route: 'cron/edgar-signals' } })
    return NextResponse.json({ error: depErr.message }, { status: 500 })
  }
  const departures = (rawDepartures ?? []) as unknown as Departure[]
  if (!departures.length) return NextResponse.json({ checked: companies.length, inserted: 0 })

  // Current incumbents - used to identify which departed roles are still unfilled
  const { data: rawCurrent } = await admin
    .from('executive_positions')
    .select('company_cik, title_normalized')
    .in('company_cik', ciks)
    .eq('is_current', true)
    .not('title_normalized', 'is', null)

  const filledRoles = new Set(
    ((rawCurrent ?? []) as unknown as CurrentExec[])
      .map(e => `${e.company_cik}:${e.title_normalized}`)
  )

  const vacancies = departures.filter((d) => {
    if (!d.end_date) return false
    if (filledRoles.has(`${d.company_cik}:${d.title_normalized}`)) return false
    const titleToCheck = d.title_normalized ?? d.title ?? ''
    if (!EXEC_TITLE_REGEX.test(titleToCheck)) return false
    if (/\bgeneral\s+manager\b/i.test(titleToCheck)) return false
    return true
  })

  if (!vacancies.length) return NextResponse.json({ checked: companies.length, inserted: 0 })

  // Existing signals for dedup - keyed by "companyId:accession"
  const { data: rawExisting } = await admin
    .from('company_signals')
    .select('company_id, source_url')
    .in('company_id', companiesWithValidCik.map(c => c.id))
    .eq('signal_type', 'exec_departure')

  const alreadySignaled = new Set(
    ((rawExisting ?? []) as unknown as ExistingSignal[])
      .filter(s => s.source_url)
      .map(s => `${s.company_id}:${s.source_url}`)
  )

  // Index pipeline companies by CIK - one CIK can appear in multiple users' pipelines
  const companiesByCik: Record<string, PipelineCompany[]> = {}
  for (const c of companiesWithValidCik) {
    if (!companiesByCik[c.sec_cik]) companiesByCik[c.sec_cik] = []
    companiesByCik[c.sec_cik].push(c)
  }

  const userIds = [...new Set(companies.map((c) => c.user_id))]
  const { data: rawProfiles } = await admin
    .from('user_profiles')
    .select('user_id, role_type, search_persona, role_family, role_title')
    .in('user_id', userIds)
  const profileByUserId = new Map<string, UserProfile>()
  for (const profile of (rawProfiles ?? []) as unknown as UserProfile[]) {
    profileByUserId.set(profile.user_id, profile)
  }

  let inserted = 0
  let skipped = 0

  for (const vacancy of vacancies) {
    const matchedCompanies = companiesByCik[vacancy.company_cik ?? ''] ?? []
    const accession = vacancy.sec_accession_number ?? null

    for (const company of matchedCompanies) {
      const dedupeKey = `${company.id}:${accession}`
      if (accession && alreadySignaled.has(dedupeKey)) {
        skipped++
        continue
      }

      const roleLabel = TITLE_LABEL[vacancy.title_normalized ?? ''] ?? vacancy.title
      const depLabel = DEPARTURE_LABEL[vacancy.departure_type ?? ''] ?? 'departure'
      const summary = `${roleLabel} ${depLabel}. No replacement announced as of ${vacancy.end_date}.`
      const profile = profileByUserId.get(company.user_id)
      const profileContext = enrichSignalProfileContext({
        roleType: profile?.role_type,
        searchPersona: profile?.search_persona,
        roleFamily: profile?.role_family,
        roleTitle: profile?.role_title,
      })
      const relevance = computePersonaRelevance('exec_departure', {
        roleType: profile?.role_type,
        searchPersona: profile?.search_persona,
        roleFamily: profile?.role_family,
        roleTitle: profile?.role_title,
      })
      const confidence = computeSignalConfidence({
        signalType: 'exec_departure',
        sourceKind: 'sec_filing',
        hasSourceUrl: !!accession,
        evidenceCount: 2,
        signalDate: vacancy.end_date as string,
      })
      if (confidence < MIN_CONFIDENCE) {
        skipped++
        continue
      }

      const { error: insErr } = await admin.from('company_signals').insert({
        company_id:     company.id,
        user_id:        company.user_id,
        signal_type:    'exec_departure',
        signal_summary: summary,
        signal_date:    vacancy.end_date as string,
        source_url:     accession,
        source_kind:    'sec_filing',
        confidence,
        focus_tags: ['exec_departure', 'leadership_transition'],
        evidence_snippets: [summary],
        profile_channel: profileContext.profileChannel,
        profile_persona: profileContext.profilePersona,
        relevance_score: relevance,
      })

      if (insErr) {
        Sentry.captureException(insErr, { extra: { route: 'cron/edgar-signals', company: company.id } })
      } else {
        inserted++
        if (accession) alreadySignaled.add(dedupeKey)
      }
    }
  }

  return NextResponse.json({
    checked: companies.length,
    validCiks: companiesWithValidCik.length,
    ciks: ciks.length,
    vacancies: vacancies.length,
    inserted,
    skipped,
  })
}
