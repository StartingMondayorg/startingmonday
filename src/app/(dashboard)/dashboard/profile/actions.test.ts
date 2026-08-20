import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  upsert: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: state.redirect }))
vi.mock('next/cache', () => ({ revalidatePath: state.revalidatePath }))
vi.mock('@/lib/events', () => ({ logEvent: vi.fn() }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: state.getUser },
    from: () => ({
      upsert: state.upsert,
    }),
  }),
}))

import { saveProfile } from './actions'

function formData(posture: string) {
  const data = new FormData()
  data.set('search_posture', posture)
  return data
}

describe('profile posture persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    state.upsert.mockResolvedValue({ error: null })
  })

  it('persists an approved posture and returns to the profile page', async () => {
    await saveProfile(formData('exploring'))

    expect(state.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', search_posture: 'exploring' }),
      { onConflict: 'user_id' },
    )
    expect(state.revalidatePath).toHaveBeenCalledWith('/dashboard')
    expect(state.redirect).toHaveBeenCalledWith('/dashboard/profile?saved=1')
  })

  it('does not persist an unknown posture value', async () => {
    await saveProfile(formData('internal_score_mode'))

    expect(state.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ search_posture: null }),
      { onConflict: 'user_id' },
    )
  })
})
