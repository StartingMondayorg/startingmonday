import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  is: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: state.from }),
}))

import { logCompanyWatch, logEvent, markOfferAccepted } from './events'

describe('event writers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.maybeSingle.mockResolvedValue({ data: { signup_source: 'referral', referral_source: null, acquisition_channel: 'partner' } })
    state.insert.mockResolvedValue({ error: null })
    state.is.mockResolvedValue({ error: null })
    state.eq.mockReturnValue({ maybeSingle: state.maybeSingle, is: state.is })
    state.update.mockReturnValue({ eq: state.eq })
    state.from.mockImplementation((table: string) => {
      if (table === 'users') return { select: () => ({ eq: state.eq }), update: state.update }
      return { insert: state.insert }
    })
  })

  it('adds source context without replacing explicit event properties', async () => {
    await logEvent('user-1', 'dashboard_viewed', { layout: 'three_zone', signup_source: 'direct' })

    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      event_name: 'dashboard_viewed',
      properties: expect.objectContaining({ layout: 'three_zone', signup_source: 'direct', acquisition_channel: 'partner' }),
    }))
  })

  it('writes company watch and offer events without throwing', async () => {
    await logCompanyWatch('user-1', 'company-1', {
      sector: 'Technology', careerPageUrlPresent: true, fitScore: 88, stage: 'watching',
    })
    await markOfferAccepted('user-1')

    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ company_id: 'company-1', fit_score: 88 }))
    expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ offer_accepted_at: expect.any(String) }))
  })
})
