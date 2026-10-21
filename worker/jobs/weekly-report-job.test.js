import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSupabase, sendEmail } = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('../lib/supabase.js', () => ({ getSupabase }))
vi.mock('../lib/send-email.js', () => ({ sendEmail }))
vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { runWeeklyReportJob, selectWeeklySummaryRecipients } from './weekly-report-job.js'

function thenableQuery(result) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const key of ['select', 'eq', 'is', 'in', 'gte', 'order', 'limit', 'single']) query[key].mockReturnValue(query)
  return query
}

describe('weekly-report-job recipients (opt-in only)', () => {
  beforeEach(() => {
    getSupabase.mockReset()
    sendEmail.mockReset()
  })

  it('returns no recipients when nobody has opted in, without querying users', async () => {
    const profiles = thenableQuery({ data: [], error: null })
    const from = vi.fn(table => {
      if (table === 'user_profiles') return profiles
      throw new Error(`unexpected table ${table}`)
    })

    const recipients = await selectWeeklySummaryRecipients({ from })

    expect(recipients).toEqual([])
    expect(profiles.eq).toHaveBeenCalledWith('weekly_summary_opt_in', true)
    expect(from).not.toHaveBeenCalledWith('users')
  })

  it('limits recipients to opted-in users with an active or trialing subscription', async () => {
    const profiles = thenableQuery({ data: [{ user_id: 'opted-in' }, { user_id: 'churned' }], error: null })
    const users = thenableQuery({ data: [{ id: 'opted-in', email: 'in@example.com' }], error: null })
    const from = vi.fn(table => {
      if (table === 'user_profiles') return profiles
      if (table === 'users') return users
      throw new Error(`unexpected table ${table}`)
    })

    const recipients = await selectWeeklySummaryRecipients({ from })

    expect(recipients).toEqual([{ id: 'opted-in', email: 'in@example.com' }])
    expect(users.in).toHaveBeenCalledWith('id', ['opted-in', 'churned'])
    expect(users.in).toHaveBeenCalledWith('subscription_status', ['trialing', 'active'])
  })

  it('returns no recipients when the opt-in query fails', async () => {
    const profiles = thenableQuery({ data: null, error: { message: 'down' } })
    const recipients = await selectWeeklySummaryRecipients({ from: () => profiles })
    expect(recipients).toEqual([])
  })

  it('sends nothing when nobody has opted in', async () => {
    const profiles = thenableQuery({ data: [], error: null })
    getSupabase.mockReturnValue({ from: () => profiles })

    await runWeeklyReportJob()

    expect(sendEmail).not.toHaveBeenCalled()
  })
})
