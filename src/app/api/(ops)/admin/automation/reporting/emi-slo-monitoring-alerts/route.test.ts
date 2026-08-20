import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  exportInsert: null as Record<string, unknown> | null,
  obsInsert: null as Record<string, unknown> | null,
  alertInsert: null as Record<string, unknown>[] | null,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: state.from }),
}))

import { POST } from './route'

describe('emi slo monitoring alerts route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.exportInsert = null
    state.obsInsert = null
    state.alertInsert = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: {},
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: { referenceDate: '2026-06-19T00:00:00.000Z' },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'emi_kpi_snapshots') {
        const chain = {
          select: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                metric_name: 'assessment_completion_percent',
                metric_value: 100,
                metric_status: 'ok',
                week_end: '2026-06-15',
                generated_at: '2026-06-19T00:00:00.000Z',
              },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'user_events') {
        const chain = {
          select: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { user_id: 'u1', event_name: 'briefing_viewed', created_at: '2026-06-18T12:00:00.000Z' },
              { user_id: 'u2', event_name: 'briefing_viewed', created_at: '2026-06-18T12:00:00.000Z' },
              { user_id: 'u1', event_name: 'emi_daily_loop_loaded', created_at: '2026-06-18T12:01:00.000Z' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'users') {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { id: 'u1', briefing_frequency: 'weekly', weekly_digest_sent_at: '2026-06-18T00:00:00.000Z' },
              { id: 'u2', briefing_frequency: 'weekly', weekly_digest_sent_at: null },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'onboarding_video_webhook_events') {
        const chain = {
          select: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                received_at: '2026-06-18T10:00:00.000Z',
                processed_at: '2026-06-18T10:09:00.000Z',
                event_status: 'processed',
              },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'automation_alerts') {
        return {
          insert: vi.fn((payload: Record<string, unknown>[]) => {
            state.alertInsert = payload
            return Promise.resolve({ data: null, error: null })
          }),
        }
      }

      if (table === 'emi_sprint_export_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.exportInsert = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'export_502' }, error: null })),
        }
        return chain
      }

      if (table === 'scheduled_job_observability_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.obsInsert = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'obs_502' }, error: null })),
        }
        return chain
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('creates slo export, observability run, and owner alerts when thresholds breach', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/emi-slo-monitoring-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      sprintKey: 'sprint_6_emi_slo_monitoring',
      exportRunId: 'export_502',
      runId: 'obs_502',
      status: 'late',
    })

    expect(state.exportInsert).toMatchObject({
      user_id: 'user_1',
      sprint_key: 'sprint_6_emi_slo_monitoring',
    })

    expect(state.obsInsert).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-slo-monitoring-alerts',
      status: 'late',
    })

    expect(state.alertInsert).toBeTruthy()
    expect(state.alertInsert?.length).toBeGreaterThan(0)
  })
})