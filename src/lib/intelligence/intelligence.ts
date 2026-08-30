import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rankSignals } from '@/lib/intelligence/intelligence-quality'

export type IntelSignal = {
  id: string
  signal_type: string
  signal_summary: string
  signal_date: string
  source_url: string | null
  source_kind: string | null
  confidence: number | null
  focus_tags: string[] | null
}

export type IntelCompany = {
  slug: string
  company_name: string
  description: string | null
  sector: string | null
  website: string | null
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function getIntelCompany(slug: string): Promise<IntelCompany | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('intelligence_companies')
    .select('slug, company_name, description, sector, website')
    .eq('slug', slug)
    .single()
  return data ?? null
}

export async function getIntelSignals(companyName: string): Promise<IntelSignal[]> {
  const admin = createAdminClient()

  // Aggregate signals across all users tracking this company
  // service-role bypasses RLS; dedup by source_url
  const { data } = await admin
    .from('company_signals')
    .select('id, signal_type, signal_summary, signal_date, source_url, source_kind, confidence, focus_tags, companies!inner(name)')
    .ilike('companies.name', companyName)
    .neq('signal_type', 'pattern_alert')
    .order('signal_date', { ascending: false })
    .limit(50)

  if (!data) return []

  // Deduplicate by source_url (same event written for multiple users)
  const seen = new Set<string>()
  const deduped: IntelSignal[] = []
  for (const row of data) {
    const key = row.source_url ?? `${row.signal_type}:${row.signal_summary.slice(0, 60)}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push({
        id:             row.id,
        signal_type:    row.signal_type,
        signal_summary: row.signal_summary,
        signal_date:    row.signal_date,
        source_url:     row.source_url,
        source_kind:    row.source_kind,
        confidence:     row.confidence,
        focus_tags:     row.focus_tags,
      })
    }
    if (deduped.length >= 20) break
  }
  const ranked = rankSignals(deduped, { roleType: 'executive', searchPersona: 'active' })
  return ranked.map((r) => ({ ...r.signal, confidence: r.confidence }))
}

export async function validateAccessToken(slug: string, token: string | null): Promise<boolean> {
  if (!token) return false
  const supabase = await createClient()
  const { data } = await supabase
    .from('intelligence_access_tokens')
    .select('id, expires_at')
    .eq('id', token)
    .eq('company_slug', slug)
    .single()
  if (!data) return false
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false
  return true
}

export async function createAccessToken(
  slug: string,
  userId: string,
  label: string,
  expiresInDays: number | null = 30,
): Promise<string> {
  const admin = createAdminClient()
  const expires_at = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
    : null
  const { data, error } = await admin
    .from('intelligence_access_tokens')
    .insert({ company_slug: slug, created_by: userId, label, expires_at })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create token')
  return data.id
}

export async function upsertIntelCompany(
  userId: string,
  fields: { company_name: string; description?: string; sector?: string; website?: string },
): Promise<string> {
  const admin = createAdminClient()
  const slug = slugify(fields.company_name)
  const { error } = await admin
    .from('intelligence_companies')
    .upsert(
      { slug, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'slug' },
    )
  if (error) throw new Error(error.message)
  void userId // created_by not on table, just caller context
  return slug
}

const SIGNAL_LABELS: Record<string, string> = {
  funding:        'Funding',
  exec_departure: 'Exec Departure',
  exec_hire:      'Exec Hire',
  acquisition:    'Acquisition',
  expansion:      'Expansion',
  layoffs:        'Layoffs',
  ipo:            'IPO',
  new_product:    'New Product',
  award:          'Award',
  pattern_alert:  'Pattern Alert',
  filing_trend:   'Filing Trend',
  partnership:    'Partnership',
  board_change:   'Board Change',
  regulatory_change: 'Regulatory Change',
  activist_entry: 'Activist Entry',
  insider_sale:   'Insider Sale',
}

export function signalLabel(type: string): string {
  return SIGNAL_LABELS[type] ?? type
}

/*
  One map for both themes. This used to be a SIGNAL_COLORS / SIGNAL_COLORS_DARK
  pair because the light and dark surfaces needed different literal hues; the
  semantic tokens already resolve per theme, so the split had nothing left to
  express and call sites no longer have to know which surface they are on.
*/
export const SIGNAL_COLORS: Record<string, string> = {
  funding:           'bg-success/10 text-success',
  exec_departure:    'bg-warning/10 text-warning',
  exec_hire:         'bg-info/10 text-info',
  acquisition:       'bg-info/10 text-info',
  expansion:         'bg-success/10 text-success',
  layoffs:           'bg-destructive/10 text-destructive',
  ipo:               'bg-primary/10 text-primary',
  new_product:       'bg-info/10 text-info',
  award:             'bg-warning/10 text-warning',
  filing_trend:      'bg-muted/60 text-muted-foreground',
  partnership:       'bg-info/10 text-info',
  board_change:      'bg-info/10 text-info',
  regulatory_change: 'bg-destructive/10 text-destructive',
  activist_entry:    'bg-destructive/10 text-destructive',
  insider_sale:      'bg-muted/60 text-muted-foreground',
}

export const SIGNAL_FALLBACK_COLOR = 'bg-muted/60 text-muted-foreground'
