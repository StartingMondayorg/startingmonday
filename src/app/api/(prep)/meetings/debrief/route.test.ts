import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  rows: [] as Array<any>,
  authOk: true,
  userId: 'user_1',
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: async () => {
    if (!state.authOk) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as any,
      }
    }

    return {
      ok: true,
      userId: state.userId,
      response: new Response(null, { status: 200 }) as any,
    }
  },
  withAuthCookies: (response: Response) => response,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table !== 'meeting_debriefs') {
        throw new Error(`Unexpected table: ${table}`)
      }

      const query: {
        mode: 'select' | 'insert' | 'delete' | null
        selectedFields: string | null
        eq: Record<string, any>
        in: Record<string, string[]>
        insertPayload: any | null
      } = {
        mode: null,
        selectedFields: null,
        eq: {},
        in: {},
        insertPayload: null,
      }

      const builder: any = {
        select(fields: string) {
          query.mode = query.mode ?? 'select'
          query.selectedFields = fields
          return builder
        },
        eq(column: string, value: any) {
          query.eq[column] = value
          return builder
        },
        in(column: string, values: string[]) {
          query.in[column] = values
          return builder
        },
        order() {
          return builder
        },
        limit() {
          if (query.mode !== 'select') {
            return Promise.resolve({ data: [], error: null })
          }

          const filtered = state.rows.filter((row) => {
            if (query.eq.user_id && row.user_id !== query.eq.user_id) return false
            return true
          })

          return Promise.resolve({ data: filtered, error: null })
        },
        insert(payload: any) {
          query.mode = 'insert'
          query.insertPayload = payload
          return builder
        },
        delete() {
          query.mode = 'delete'
          return builder
        },
        single() {
          if (query.mode !== 'insert') {
            return Promise.resolve({ data: null, error: null })
          }

          const next = {
            id: `debrief_${state.rows.length + 1}`,
            created_at: '2026-07-06T20:00:00.000Z',
            ...query.insertPayload,
          }
          state.rows.unshift(next)
          return Promise.resolve({ data: next, error: null })
        },
        then(resolve: any) {
          if (query.mode === 'delete') {
            const ids = query.in.id ?? []
            const owned = state.rows.filter((row) => row.user_id === query.eq.user_id)
            const toDelete = owned.filter((row) => ids.includes(row.id)).map((row) => row.id)
            state.rows = state.rows.filter((row) => !toDelete.includes(row.id))
            return Promise.resolve(resolve({ data: toDelete.map((id) => ({ id })), error: null }))
          }

          return Promise.resolve(resolve({ data: [], error: null }))
        },
      }

      return builder
    },
  }),
}))

import { DELETE, GET, POST } from './route'

describe('meetings debrief route', () => {
  beforeEach(() => {
    state.authOk = true
    state.userId = 'user_1'
    state.rows = []
  })

  it('saves debrief, returns history, computes interviewer consistency, and supports delete cleanup', async () => {
    const createReq = new NextRequest('https://startingmonday.app/api/meetings/debrief', {
      method: 'POST',
      body: JSON.stringify({
        meetingName: 'Validation Meeting',
        meetingDate: '2026-07-06',
        interviewerName: 'Alexsei Validation',
        interviewStage: 'Hiring manager round',
        coreAnswers: {
          core_1: 'Answer one',
        },
        stageAnswers: {
          screening_1: 'Ambiguous opening rationale',
          screening_2: 'No clear blockers owner',
        },
        stageScores: {
          screening_1: 'vague',
          screening_2: 'vague',
        },
        overallReview: 'Needs deeper diligence before moving forward.',
      }),
    })

    const createRes = await POST(createReq)
    const createBody = await createRes.json() as {
      ok: boolean
      item: {
        id: string
        vague_count: number
        risk_flag: boolean
      }
    }

    expect(createRes.status).toBe(200)
    expect(createBody.ok).toBe(true)
    expect(createBody.item.vague_count).toBe(2)
    expect(createBody.item.risk_flag).toBe(true)

    const listReq = new NextRequest('https://startingmonday.app/api/meetings/debrief?limit=40')
    const listRes = await GET(listReq)
    const listBody = await listRes.json() as {
      ok: boolean
      items: Array<{ id: string; interviewer_name: string | null; vague_count: number; risk_flag: boolean }>
      interviewerConsistency: Array<{ interviewer: string; meetings: number; avgVagueCount: number; riskFlagRate: number; consistencySignal: string }>
    }

    expect(listRes.status).toBe(200)
    expect(listBody.ok).toBe(true)
    expect(listBody.items.length).toBe(1)
    expect(listBody.items[0].interviewer_name).toBe('Alexsei Validation')
    expect(listBody.items[0].vague_count).toBe(2)
    expect(listBody.items[0].risk_flag).toBe(true)
    expect(listBody.interviewerConsistency).toEqual([
      expect.objectContaining({
        interviewer: 'Alexsei Validation',
        meetings: 1,
        avgVagueCount: 2,
        riskFlagRate: 1,
        consistencySignal: 'high-risk',
      }),
    ])

    const deleteReq = new NextRequest('https://startingmonday.app/api/meetings/debrief', {
      method: 'DELETE',
      body: JSON.stringify({ ids: [createBody.item.id] }),
    })

    const deleteRes = await DELETE(deleteReq)
    const deleteBody = await deleteRes.json() as { ok: boolean; deletedIds: string[] }

    expect(deleteRes.status).toBe(200)
    expect(deleteBody.ok).toBe(true)
    expect(deleteBody.deletedIds).toEqual([createBody.item.id])

    const postDeleteListRes = await GET(listReq)
    const postDeleteListBody = await postDeleteListRes.json() as { items: unknown[]; interviewerConsistency: unknown[] }
    expect(postDeleteListBody.items).toEqual([])
    expect(postDeleteListBody.interviewerConsistency).toEqual([])
  })

  it('returns 400 for delete requests without ids', async () => {
    const deleteReq = new NextRequest('https://startingmonday.app/api/meetings/debrief', {
      method: 'DELETE',
      body: JSON.stringify({ ids: [] }),
    })

    const res = await DELETE(deleteReq)
    expect(res.status).toBe(400)
  })
})
