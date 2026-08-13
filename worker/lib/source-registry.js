import { logger } from './logger.js'

const ALLOWED_SOURCE_STATUSES = new Set(['active', 'pilot'])
const ALLOWED_RIGHTS_STATUSES = new Set(['allowed', 'approved'])

export async function resolveSourceDecision(supabase, sourceKey) {
  try {
    const { data, error } = await supabase
      .from('signal_sources')
      .select('source_key, source_status, rights_status')
      .eq('source_key', sourceKey)
      .maybeSingle()

    if (error) {
      logger.warn('source-registry: read failed', { sourceKey, error: error.message })
      return {
        sourceKey,
        allowed: false,
        sourceStatus: 'unknown',
        rightsStatus: 'unknown',
        reason: 'registry_read_failed_fail_closed',
      }
    }

    if (data?.source_key) {
      const sourceStatus = data.source_status ?? 'unknown'
      const rightsStatus = data.rights_status ?? 'unknown'
      const allowed = ALLOWED_SOURCE_STATUSES.has(String(sourceStatus).toLowerCase())
        && ALLOWED_RIGHTS_STATUSES.has(String(rightsStatus).toLowerCase())
      return {
        sourceKey,
        allowed,
        sourceStatus,
        rightsStatus,
        reason: allowed ? 'explicitly_allowed_by_registry' : 'not_explicitly_allowed_by_registry',
      }
    }

    return {
      sourceKey,
      allowed: false,
      sourceStatus: 'unknown',
      rightsStatus: 'unknown',
      reason: 'registry_miss_fail_closed',
    }
  } catch (error) {
    logger.warn('source-registry: unexpected error', { sourceKey, error: error.message })
    return {
      sourceKey,
      allowed: false,
      sourceStatus: 'unknown',
      rightsStatus: 'unknown',
      reason: 'registry_exception_fail_closed',
    }
  }
}
