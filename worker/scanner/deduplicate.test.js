import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  rescanWindowHoursForTier,
  wasRecentlyScanned,
  RESCAN_WINDOW_STANDARD_HOURS,
  RESCAN_WINDOW_DAILY_HOURS,
} from './deduplicate.js'

// Minimal supabase stub: records the scanned_at cutoff the query filtered on and
// returns the rows the test supplied.
function stubSupabase(rows = []) {
  const calls = { gte: null }
  const builder = {
    select: () => builder,
    eq: () => builder,
    gte: (_col, value) => { calls.gte = value; return builder },
    limit: () => Promise.resolve({ data: rows, error: null }),
  }
  return { supabase: { from: () => builder }, calls }
}

const HOUR = 60 * 60 * 1000

describe('rescanWindowHoursForTier', () => {
  it('gives daily tiers a window shorter than their 12h cadence', () => {
    expect(rescanWindowHoursForTier('executive')).toBe(RESCAN_WINDOW_DAILY_HOURS)
    expect(rescanWindowHoursForTier('campaign')).toBe(RESCAN_WINDOW_DAILY_HOURS)
    expect(RESCAN_WINDOW_DAILY_HOURS).toBeLessThan(12)
  })

  it('falls back to the standard window for other or missing tiers', () => {
    expect(rescanWindowHoursForTier('monitor')).toBe(RESCAN_WINDOW_STANDARD_HOURS)
    expect(rescanWindowHoursForTier('active')).toBe(RESCAN_WINDOW_STANDARD_HOURS)
    expect(rescanWindowHoursForTier(undefined)).toBe(RESCAN_WINDOW_STANDARD_HOURS)
  })

  // The regression this file exists for: a 48h window against a Mon/Wed/Fri
  // 08:00 UTC cron skipped every Wednesday scan.
  it('keeps the standard window strictly under the 48h Mon-to-Wed gap', () => {
    expect(RESCAN_WINDOW_STANDARD_HOURS).toBeLessThan(48)
  })
})

describe('wasRecentlyScanned', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T08:00:00.000Z')) // a Wednesday 08:00 run
  })
  afterEach(() => vi.useRealTimers())

  it('does not skip a Wednesday run because of Mondays scan', async () => {
    const mondayScan = new Date('2026-08-17T08:04:00.000Z') // 47h56m earlier
    const { supabase, calls } = stubSupabase([])

    expect(await wasRecentlyScanned(supabase, 'c1', RESCAN_WINDOW_STANDARD_HOURS)).toBe(false)
    // Monday's row sits before the cutoff, so the query cannot match it.
    expect(new Date(calls.gte).getTime()).toBeGreaterThan(mondayScan.getTime())
  })

  it('still skips a repeat scan inside the same cycle', async () => {
    const { supabase } = stubSupabase([{ id: 'scan-1' }])
    expect(await wasRecentlyScanned(supabase, 'c1', RESCAN_WINDOW_STANDARD_HOURS)).toBe(true)
  })

  it('lets the executive evening run through 12h after the morning run', async () => {
    const { supabase, calls } = stubSupabase([])
    const morningRun = Date.now() - 12 * HOUR

    await wasRecentlyScanned(supabase, 'c1', RESCAN_WINDOW_DAILY_HOURS)
    expect(new Date(calls.gte).getTime()).toBeGreaterThan(morningRun)
  })

  it('defaults to the standard window when no window is passed', async () => {
    const { supabase, calls } = stubSupabase([])
    await wasRecentlyScanned(supabase, 'c1')
    expect(new Date(calls.gte).getTime()).toBe(Date.now() - RESCAN_WINDOW_STANDARD_HOURS * HOUR)
  })

  it('fails open when the query errors, rather than skipping the scan', async () => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      gte: () => builder,
      limit: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
    }
    expect(await wasRecentlyScanned({ from: () => builder }, 'c1')).toBe(false)
  })
})
