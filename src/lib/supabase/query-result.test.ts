import { beforeEach, describe, expect, it, vi } from 'vitest'

const sentry = vi.hoisted(() => ({ captureException: vi.fn() }))
vi.mock('@sentry/nextjs', () => sentry)

import {
  NO_ROWS_ERROR_CODE,
  SupabaseQueryError,
  countOrNull,
  isNoRowsError,
  maybeRow,
  requireNoError,
  requireRows,
  rowsOrNull,
} from './query-result'

const noRows = { code: NO_ROWS_ERROR_CODE, message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains 0 rows' }
const missingColumn = { code: '42703', message: 'column user_profiles.search_posture does not exist', details: 'secret@example.com' }
const multipleRows = { code: NO_ROWS_ERROR_CODE, message: noRows.message, details: 'The result contains 2 rows' }

describe('query-result helpers', () => {
  beforeEach(() => {
    sentry.captureException.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('recognises only a zero-row PGRST116 as the no-rows case', () => {
    expect(isNoRowsError(noRows)).toBe(true)
    expect(isNoRowsError({ ...noRows, details: 'Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row' })).toBe(true)
    expect(isNoRowsError(multipleRows)).toBe(false)
    expect(isNoRowsError({ ...noRows, details: 'The result contains 10 rows' })).toBe(false)
    expect(isNoRowsError({ code: NO_ROWS_ERROR_CODE, message: noRows.message })).toBe(false)
    expect(isNoRowsError({ ...noRows, details: null })).toBe(false)
    expect(isNoRowsError(missingColumn)).toBe(false)
    expect(isNoRowsError(null)).toBe(false)
  })

  it('throws on a multiple-row PGRST116 instead of treating it as missing data', () => {
    expect(() => maybeRow({ data: null, error: multipleRows }, 'ctx')).toThrow(/PGRST116/)
    expect(() => requireRows({ data: null, error: multipleRows }, 'ctx')).toThrow(SupabaseQueryError)
    expect(() => maybeRow({ data: null, error: { code: NO_ROWS_ERROR_CODE, message: 'x' } }, 'ctx')).toThrow(SupabaseQueryError)
    expect(rowsOrNull({ data: null, error: multipleRows }, 'ctx')).toBeNull()
    expect(sentry.captureException).toHaveBeenCalledTimes(1)
  })

  describe('maybeRow', () => {
    it('returns the row on success', () => {
      expect(maybeRow({ data: { id: 1 }, error: null }, 'ctx')).toEqual({ id: 1 })
    })

    it('returns null for no rows', () => {
      expect(maybeRow({ data: null, error: noRows }, 'ctx')).toBeNull()
      expect(maybeRow({ data: null, error: null }, 'ctx')).toBeNull()
    })

    it('throws a descriptive error for real failures without echoing details', () => {
      let thrown: unknown
      try {
        maybeRow({ data: null, error: missingColumn }, 'dashboard.user_profiles')
      } catch (err) {
        thrown = err
      }
      expect(thrown).toBeInstanceOf(SupabaseQueryError)
      const err = thrown as SupabaseQueryError
      expect(err.message).toContain('dashboard.user_profiles')
      expect(err.message).toContain('42703')
      expect(err.message).toContain('search_posture does not exist')
      expect(err.message).not.toContain('secret@example.com')
      expect(err.code).toBe('42703')
      expect(err.context).toBe('dashboard.user_profiles')
    })
  })

  describe('requireNoError', () => {
    it('passes successful and no-row results through unchanged', () => {
      const ok = { data: [1], error: null, count: 3 }
      expect(requireNoError(ok, 'ctx')).toBe(ok)
      const empty = { data: null, error: noRows }
      expect(requireNoError(empty, 'ctx')).toBe(empty)
    })

    it('throws on errors with no code', () => {
      expect(() => requireNoError({ data: null, error: { message: 'fetch failed' } }, 'ctx')).toThrow(
        'Supabase query failed [ctx]: no_code fetch failed',
      )
    })
  })

  describe('requireRows', () => {
    it('returns rows, [] for null data, and throws on error', () => {
      expect(requireRows({ data: [{ id: 'a' }], error: null }, 'ctx')).toEqual([{ id: 'a' }])
      expect(requireRows({ data: null, error: null }, 'ctx')).toEqual([])
      expect(() => requireRows({ data: null, error: missingColumn }, 'companies')).toThrow(SupabaseQueryError)
    })
  })

  describe('rowsOrNull', () => {
    it('returns rows without reporting on success', () => {
      expect(rowsOrNull({ data: [{ id: 'a' }], error: null }, 'ctx')).toEqual([{ id: 'a' }])
      expect(rowsOrNull({ data: null, error: null }, 'ctx')).toEqual([])
      expect(sentry.captureException).not.toHaveBeenCalled()
    })

    it('returns null and reports real failures instead of throwing', () => {
      expect(rowsOrNull({ data: null, error: missingColumn }, 'dashboard.signals')).toBeNull()
      expect(sentry.captureException).toHaveBeenCalledTimes(1)
      const [err, hint] = sentry.captureException.mock.calls[0]
      expect(err).toBeInstanceOf(SupabaseQueryError)
      expect(hint.tags).toMatchObject({ query_context: 'dashboard.signals', supabase_code: '42703' })
      expect(JSON.stringify(hint)).not.toContain('secret@example.com')
      expect(console.error).toHaveBeenCalled()
    })

    it('does not throw when Sentry itself throws', () => {
      sentry.captureException.mockImplementationOnce(() => {
        throw new Error('sentry down')
      })
      expect(rowsOrNull({ data: null, error: missingColumn }, 'ctx')).toBeNull()
    })
  })

  describe('countOrNull', () => {
    it('returns the count, 0 for a null count, and null after reporting a failure', () => {
      expect(countOrNull({ count: 4, error: null }, 'ctx')).toBe(4)
      expect(countOrNull({ count: null, error: null }, 'ctx')).toBe(0)
      expect(countOrNull({ count: null, error: missingColumn }, 'ctx')).toBeNull()
      expect(sentry.captureException).toHaveBeenCalledTimes(1)
    })
  })
})
