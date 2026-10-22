import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  revalidatePathMock,
  getUserMock,
  updateMock,
  eqMock,
  fromMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getUserMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  fromMock: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}))

import { markFollowUpDone, updateFollowUp } from './actions'

describe('dashboard actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    eqMock.mockImplementation(() => ({ eq: eqMock }))
    updateMock.mockImplementation(() => ({ eq: eqMock }))
    fromMock.mockReturnValue({ update: updateMock })

    getUserMock.mockResolvedValue({
      data: {
        user: { id: 'user-123' },
      },
    })
  })

  it('marks follow-up done and revalidates dashboard paths', async () => {
    const formData = new FormData()
    formData.set('id', 'follow-up-1')

    await markFollowUpDone(formData)

    expect(fromMock).toHaveBeenCalledWith('follow_ups')
    expect(updateMock).toHaveBeenCalledWith({ status: 'completed' })
    expect(eqMock).toHaveBeenCalledWith('id', 'follow-up-1')
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123')
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard')
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/follow-ups')
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/contacts', 'layout')
  })

  it('updates follow-up action and optional due date', async () => {
    const formData = new FormData()
    formData.set('id', 'follow-up-2')
    formData.set('action', 'Send intro note')
    formData.set('due_date', '2026-05-30')

    await updateFollowUp(formData)

    expect(fromMock).toHaveBeenCalledWith('follow_ups')
    expect(updateMock).toHaveBeenCalledWith({ action: 'Send intro note', due_date: '2026-05-30' })
    expect(eqMock).toHaveBeenCalledWith('id', 'follow-up-2')
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123')
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard')
  })

  it('returns early when user is not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    const formData = new FormData()
    formData.set('id', 'follow-up-3')
    formData.set('action', 'Anything')

    await updateFollowUp(formData)

    expect(fromMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})