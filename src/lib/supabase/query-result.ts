import * as Sentry from '@sentry/nextjs'

/**
 * supabase-js never throws on a failed query: it resolves `{ data: null, error }`.
 * Destructuring only `data` turns a schema drift (42703 undefined column), an RLS
 * denial (42501), or a network failure into "no row" / "empty list", which is how
 * the 2026-10-22 staging dashboard <-> onboarding redirect loop happened (P1-4).
 *
 * These helpers make the distinction explicit:
 *  - zero rows for `.single()` (PGRST116 with "0 rows" details) is a legitimate empty answer.
 *  - every other error either throws (data the page cannot work without) or is
 *    reported and degraded (optional enrichment).
 */

/**
 * PostgREST code for a singular-query cardinality violation. It covers both zero
 * rows and more than one row, so the code alone does not mean "no row".
 */
export const NO_ROWS_ERROR_CODE = 'PGRST116'

// PostgREST 12: "The result contains 0 rows"; older servers and postgrest-js:
// "Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row".
const ZERO_ROWS_DETAILS = /(?:^|\D)0 rows\b/

export type QueryError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

export type QueryResult<T> = {
  data: T | null
  error: QueryError | null
  count?: number | null
}

export class SupabaseQueryError extends Error {
  readonly context: string
  readonly code: string | null

  constructor(context: string, error: QueryError) {
    const code = error.code ?? null
    // Only the code and PostgREST message: `details` can echo row values.
    super(`Supabase query failed [${context}]: ${code ?? 'no_code'} ${error.message ?? 'unknown error'}`)
    this.name = 'SupabaseQueryError'
    this.context = context
    this.code = code
  }
}

/** True only for a confirmed zero-row PGRST116; multiple rows or missing details are real errors. */
export function isNoRowsError(error: QueryError | null | undefined): boolean {
  return error?.code === NO_ROWS_ERROR_CODE && ZERO_ROWS_DETAILS.test(error.details ?? '')
}

/**
 * Throws a SupabaseQueryError when the query failed for any reason other than
 * "no rows". Returns the result unchanged otherwise.
 */
export function requireNoError<R extends { error: QueryError | null }>(result: R, context: string): R {
  if (result.error && !isNoRowsError(result.error)) {
    throw new SupabaseQueryError(context, result.error)
  }
  return result
}

/** Single-row read: the row, `null` when no row exists, throws on any real error. */
export function maybeRow<R extends QueryResult<unknown>>(result: R, context: string): NonNullable<R['data']> | null {
  return (requireNoError(result, context).data ?? null) as NonNullable<R['data']> | null
}

/** List read the caller cannot work without: the rows, throws on any error. */
export function requireRows<R extends QueryResult<unknown[]>>(result: R, context: string): NonNullable<R['data']> {
  return (requireNoError(result, context).data ?? []) as NonNullable<R['data']>
}

/** Logs and reports a failed optional query to Sentry. Never throws. */
export function reportQueryError(error: QueryError, context: string): void {
  const err = new SupabaseQueryError(context, error)
  try {
    console.error('[supabase] optional query failed; degrading', { context, code: err.code, message: error.message })
  } catch { /* logging must not throw */ }
  try {
    Sentry.captureException(err, {
      level: 'warning',
      tags: { area: 'supabase_query', query_context: context, supabase_code: err.code ?? 'none' },
    })
  } catch { /* reporting must not throw */ }
}

/**
 * Optional list read: the rows, or `null` after reporting when the query failed,
 * so the caller can tell "unknown" apart from "empty". "No rows" is `[]`.
 */
export function rowsOrNull<R extends QueryResult<unknown[]>>(result: R, context: string): NonNullable<R['data']> | null {
  if (result.error && !isNoRowsError(result.error)) {
    reportQueryError(result.error, context)
    return null
  }
  return (result.data ?? []) as NonNullable<R['data']>
}

/** Optional `count` read: the count, or `null` after reporting when the query failed. */
export function countOrNull(result: { count?: number | null; error: QueryError | null }, context: string): number | null {
  if (result.error) {
    reportQueryError(result.error, context)
    return null
  }
  return result.count ?? 0
}
