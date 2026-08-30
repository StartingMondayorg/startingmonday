import { logger } from './logger.js'

// A Supabase `.limit(n)` that returns exactly n rows is indistinguishable from a
// query that genuinely matched n rows. The job then reports success having
// processed a truncated set, with nothing in the logs to say so.
//
// That is the same failure shape as SMK-471: silent under-delivery that looks
// like normal operation. It took production measurement to notice that one, and
// a row cap would be harder to spot because the counts still look plausible.
//
// Returns the row count so callers can log it alongside their own totals.
export function warnIfTruncated(rows, limit, context = {}) {
  const returned = rows?.length ?? 0
  // A non-positive cap is not a cap; warning on it would fire on every empty
  // result forever.
  if (!(limit > 0)) return returned
  if (returned < limit) return returned

  logger.warn('query hit its row limit — results are truncated', {
    event: 'query_limit_reached',
    ...context,
    returned,
    limit,
  })
  return returned
}
