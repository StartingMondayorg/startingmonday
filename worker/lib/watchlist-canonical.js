// Canonical company resolution for watchlist entries (WS11-01/05).
// Same match priority as canonical-company.js's resolveCanonicalCompany
// (CIK > domain > normalized name), but resolves from a plain
// { name, domain, cik } tuple instead of a per-user companies row, since
// watchlist entries never belong to the per-user companies table.

import { normalizeCompanyName } from './canonical-company.js'
import { logger } from './logger.js'

// Resolves (get-or-create) the canonical company for a watchlist entry.
// Returns the canonical company id, or null when resolution is impossible.
// Never throws — callers degrade gracefully (skip the event write).
export async function resolveCanonicalCompanyForWatchlist(supabase, { name, domain = null, cik = null, sector = null }) {
  if (!name) return null
  const nameNormalized = normalizeCompanyName(name)
  if (!nameNormalized) return null

  try {
    let canonicalId = null

    if (cik) {
      const { data } = await supabase
        .from('canonical_companies')
        .select('id')
        .eq('sec_cik_padded', cik)
        .limit(1)
        .maybeSingle()
      canonicalId = data?.id ?? null
    }
    if (!canonicalId && domain) {
      const { data } = await supabase
        .from('canonical_companies')
        .select('id')
        .eq('domain', domain)
        .limit(1)
        .maybeSingle()
      canonicalId = data?.id ?? null
    }
    if (!canonicalId) {
      const { data } = await supabase
        .from('canonical_companies')
        .select('id')
        .eq('name_normalized', nameNormalized)
        .limit(1)
        .maybeSingle()
      canonicalId = data?.id ?? null
    }

    if (!canonicalId) {
      const { data: created, error: createError } = await supabase
        .from('canonical_companies')
        .insert({
          name,
          name_normalized: nameNormalized,
          domain,
          sec_cik_padded: cik,
          sector,
        })
        .select('id')
        .single()
      if (createError) {
        logger.warn('resolve-canonical-company-for-watchlist: insert failed', { name, error: createError.message })
        return null
      }
      canonicalId = created.id
    }

    return canonicalId
  } catch (err) {
    logger.warn('resolve-canonical-company-for-watchlist: failed', { name, error: err.message })
    return null
  }
}
