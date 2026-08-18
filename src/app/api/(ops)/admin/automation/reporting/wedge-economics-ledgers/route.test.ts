import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  marketingInserted: [] as Array<Record<string, unknown>>,
  partnerCommercialInserted: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { GET, POST } from './route'

describe('wedge economics ledgers route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.marketingInserted = []
    state.partnerCommercialInserted = []

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'automation_user',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: {
        entries: [
          {
            ledger: 'marketing_spend',
            motion: 'direct_paid_sprint',
            channel: 'paid_social',
            amount_usd: 150,
            effective_at: '2026-06-28T00:00:00.000Z',
            metadata: { campaign: 'summer_push' },
          },
          {
            ledger: 'partner_commercial',
            partner_id: '11111111-1111-4111-8111-111111111111',
            event_type: 'pilot_fee_collected',
            amount_usd: 499,
            effective_at: '2026-06-28T01:00:00.000Z',
            metadata: { invoice_id: 'inv_1' },
          },
        ],
      },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'marketing_spend_entries') {
        const chain = {
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                id: 'm1',
                motion: 'direct_paid_sprint',
                channel: 'paid_social',
                amount_usd: 150,
                effective_at: '2026-06-28T00:00:00.000Z',
                metadata: { campaign: 'summer_push' },
                notes: null,
                created_at: '2026-06-28T00:01:00.000Z',
              },
            ],
            error: null,
          })),
          insert: vi.fn((rows: Array<Record<string, unknown>>) => {
            state.marketingInserted = rows
            return Promise.resolve({ error: null })
          }),
          select: vi.fn(() => chain),
        }
        return chain
      }

      if (table === 'partner_commercial_events') {
        const chain = {
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                id: 'p1',
                partner_id: '11111111-1111-4111-8111-111111111111',
                event_type: 'pilot_fee_collected',
                amount_usd: 499,
                effective_at: '2026-06-28T01:00:00.000Z',
                metadata: { invoice_id: 'inv_1' },
                created_at: '2026-06-28T01:01:00.000Z',
              },
            ],
            error: null,
          })),
          insert: vi.fn((rows: Array<Record<string, unknown>>) => {
            state.partnerCommercialInserted = rows
            return Promise.resolve({ error: null })
          }),
          select: vi.fn(() => chain),
        }
        return chain
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('returns canonical ledger rows for lookback window', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/wedge-economics-ledgers?lookbackDays=30'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      lookback_days: 30,
      marketing_spend_entries: [
        expect.objectContaining({
          id: 'm1',
          motion: 'direct_paid_sprint',
          amount_usd: 150,
        }),
      ],
      partner_commercial_events: [
        expect.objectContaining({
          id: 'p1',
          event_type: 'pilot_fee_collected',
          amount_usd: 499,
        }),
      ],
    })
  })

  it('writes mixed marketing and partner commercial entries', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/wedge-economics-ledgers', {
      method: 'POST',
      body: JSON.stringify({ entries: [] }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      inserted: {
        marketing_spend_entries: 1,
        partner_commercial_events: 1,
      },
    })

    expect(state.marketingInserted).toHaveLength(1)
    expect(state.marketingInserted[0]).toMatchObject({
      motion: 'direct_paid_sprint',
      channel: 'paid_social',
      amount_usd: 150,
    })

    expect(state.partnerCommercialInserted).toHaveLength(1)
    expect(state.partnerCommercialInserted[0]).toMatchObject({
      partner_id: '11111111-1111-4111-8111-111111111111',
      event_type: 'pilot_fee_collected',
      amount_usd: 499,
    })
  })
})
