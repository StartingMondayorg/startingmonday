import { describe, expect, it } from 'vitest'
import DashboardPage from './page'
import {
  buildThreeZoneNextMove,
  formatDashboardSignalAge,
  resolveThreeZoneDashboardPosture,
  shouldRedirectToStartDashboard,
} from './page'

describe('dashboard page module', () => {
  it('exports DashboardPage', () => {
    expect(typeof DashboardPage).toBe('function')
  })

  it('redirects first-run users who have not seen start ritual', () => {
    expect(
      shouldRedirectToStartDashboard({
        isFirstRunDashboard: true,
        hasSeenFirstRun: false,
        focus: undefined,
      }),
    ).toBe(true)
  })

  it('does not redirect when user explicitly requests main dashboard', () => {
    expect(
      shouldRedirectToStartDashboard({
        isFirstRunDashboard: true,
        hasSeenFirstRun: false,
        focus: 'main',
      }),
    ).toBe(false)
  })

  it('does not redirect after first-run page has been seen', () => {
    expect(
      shouldRedirectToStartDashboard({
        isFirstRunDashboard: true,
        hasSeenFirstRun: true,
        focus: undefined,
      }),
    ).toBe(false)
  })

  it('does not redirect non-first-run dashboard states', () => {
    expect(
      shouldRedirectToStartDashboard({
        isFirstRunDashboard: false,
        hasSeenFirstRun: false,
        focus: undefined,
      }),
    ).toBe(false)
  })

  it('maps search paths to dashboard postures', () => {
    expect(resolveThreeZoneDashboardPosture('campaign')).toBe('active')
    expect(resolveThreeZoneDashboardPosture('watcher')).toBe('exploring')
    expect(resolveThreeZoneDashboardPosture('nurture')).toBe('exploring')
    expect(resolveThreeZoneDashboardPosture(null)).toBe('not_looking')
  })

  it('uses operational state before posture for Zone 1', () => {
    const nextMove = buildThreeZoneNextMove({
      posture: 'not_looking',
      offerCompanyName: 'Acme',
      overdueCount: 2,
      freshSignal: { companyName: 'Beta', summary: 'New role signal.', href: '/dashboard/signals' },
      stalled: true,
      companyCount: 4,
      scanAgeLabel: 'today',
      nextScanDay: 'Monday',
    })

    expect(nextMove.title).toContain('Acme')
    expect(nextMove.cta).toBe('Review brief')
  })

  it('adapts fresh-signal Zone 1 copy by posture without rendering scores', () => {
    const nextMove = buildThreeZoneNextMove({
      posture: 'exploring',
      overdueCount: 0,
      freshSignal: { companyName: 'Palo Alto Networks', summary: 'Hiring VP Engineering - 3 days ago.', href: '/dashboard/signals' },
      stalled: false,
      companyCount: 4,
      scanAgeLabel: 'today',
      nextScanDay: 'Monday',
    })

    const rendered = `${nextMove.title} ${nextMove.body}`.toLowerCase()
    expect(rendered).toContain('relationship touch')
    expect(rendered).not.toContain('score')
  })

  it('formats signal age labels deterministically', () => {
    expect(formatDashboardSignalAge('2026-08-19', '2026-08-19')).toBe('today')
    expect(formatDashboardSignalAge('2026-08-18', '2026-08-19')).toBe('1 day ago')
    expect(formatDashboardSignalAge('2026-08-16', '2026-08-19')).toBe('3 days ago')
  })
})