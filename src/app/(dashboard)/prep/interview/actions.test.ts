import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  updateResult: { data: { id: 'existing' } as { id: string } | null, error: null as { message: string } | null },
  insertResult: { data: { id: 'fresh' } as { id: string } | null, error: null as { message: string } | null },
  updateCalls: [] as unknown[],
  insertCalls: [] as unknown[],
  deleteCalls: [] as string[],
  revalidated: [] as string[],
}))

vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { state.revalidated.push(p) } }))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => { throw new Error(`REDIRECT:${to}`) },
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      if (table !== 'interview_preps') throw new Error(`unexpected table ${table}`)
      return {
        update: (values: unknown) => {
          state.updateCalls.push(values)
          const chain = { eq: () => chain, select: () => chain, maybeSingle: async () => state.updateResult }
          return chain
        },
        insert: (values: unknown) => {
          state.insertCalls.push(values)
          return { select: () => ({ single: async () => state.insertResult }) }
        },
        delete: () => ({ eq: (_k: string, id: string) => ({ eq: async () => { state.deleteCalls.push(id); return { error: null } } }) }),
      }
    },
  }),
}))

import { deleteInterviewPrep, saveInterviewPrep } from './actions'

function form(entries: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

async function redirectOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.startsWith('REDIRECT:')) return message.slice('REDIRECT:'.length)
    throw err
  }
  throw new Error('expected a redirect')
}

const EXISTING = '8a1f6c5e-2b3d-4e5f-9a0b-1c2d3e4f5a6b'

describe('saveInterviewPrep', () => {
  beforeEach(() => {
    state.user = { id: 'user-1' }
    state.updateResult = { data: { id: EXISTING }, error: null }
    state.insertResult = { data: { id: 'fresh' }, error: null }
    state.updateCalls = []
    state.insertCalls = []
    state.deleteCalls = []
    state.revalidated = []
  })

  it('redirects to login without a user', async () => {
    state.user = null
    expect(await redirectOf(saveInterviewPrep(form({ positioning: 'x' })))).toBe('/login')
  })

  it('refuses an empty worksheet', async () => {
    expect(await redirectOf(saveInterviewPrep(form({ status: 'saved' })))).toBe('/prep/interview?error=empty')
    expect(state.insertCalls).toHaveLength(0)
  })

  it('inserts a new row and redirects to it', async () => {
    const to = await redirectOf(saveInterviewPrep(form({ company_name: 'Figma', positioning: 'Platform leader', status: 'saved' })))
    expect(to).toBe('/prep/interview?id=fresh&saved=saved')
    expect(state.insertCalls[0]).toMatchObject({ user_id: 'user-1', company_name: 'Figma', answers: { positioning: 'Platform leader' }, status: 'saved' })
    expect(state.revalidated).toContain('/prep/interview')
  })

  it('updates an existing row scoped to the user', async () => {
    const to = await redirectOf(saveInterviewPrep(form({ id: EXISTING, role_title: 'VP Eng' })))
    expect(to).toBe(`/prep/interview?id=${EXISTING}&saved=draft`)
    expect(state.updateCalls[0]).toMatchObject({ role_title: 'VP Eng', status: 'draft' })
    expect(state.updateCalls[0]).not.toHaveProperty('user_id')
    expect(state.insertCalls).toHaveLength(0)
  })

  it('falls through to an insert when the id no longer matches a row of this user', async () => {
    state.updateResult = { data: null, error: null }
    const to = await redirectOf(saveInterviewPrep(form({ id: EXISTING, role_title: 'VP Eng' })))
    expect(to).toBe('/prep/interview?id=fresh&saved=draft')
    expect(state.insertCalls).toHaveLength(1)
  })

  it('reports a save failure and keeps the id in the URL', async () => {
    state.updateResult = { data: null, error: { message: 'boom' } }
    const to = await redirectOf(saveInterviewPrep(form({ id: EXISTING, role_title: 'VP Eng' })))
    expect(to).toBe(`/prep/interview?error=save&id=${EXISTING}`)
    expect(state.insertCalls).toHaveLength(0)
  })
})

describe('deleteInterviewPrep', () => {
  it('deletes the given id for the user and returns to the page', async () => {
    state.user = { id: 'user-1' }
    state.deleteCalls = []
    expect(await redirectOf(deleteInterviewPrep(form({ id: EXISTING })))).toBe('/prep/interview')
    expect(state.deleteCalls).toEqual([EXISTING])
  })
})
