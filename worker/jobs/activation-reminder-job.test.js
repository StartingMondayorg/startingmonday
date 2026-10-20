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

import { ACTIVATION_DAY, buildCompanyNudgeEmail, runActivationReminderJob } from './activation-reminder-job.js'

function thenableQuery(result) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const key of ['select', 'eq', 'is', 'in', 'gte', 'lte']) query[key].mockReturnValue(query)
  return query
}

describe('activation-reminder-job', () => {
  beforeEach(() => {
    getSupabase.mockReset()
    sendEmail.mockReset()
    sendEmail.mockResolvedValue({ error: null })
  })

  it('sends exactly one day-2 message, only to opted-in trial users with no company', async () => {
    const usersQuery = thenableQuery({
      data: [
        { id: 'no-company', email: 'new@example.com', created_at: '2026-10-18T09:00:00Z' },
        { id: 'has-company', email: 'busy@example.com', created_at: '2026-10-18T10:00:00Z' },
      ],
      error: null,
    })
    const profilesQuery = thenableQuery({
      data: [{ user_id: 'no-company', full_name: 'Priya Natarajan', briefing_email: 'priya.personal@example.com' }],
      error: null,
    })
    const companiesQuery = thenableQuery({ data: [{ user_id: 'has-company' }], error: null })

    getSupabase.mockReturnValue({
      from: vi.fn(table => {
        if (table === 'users') return usersQuery
        if (table === 'user_profiles') return profilesQuery
        if (table === 'companies') return companiesQuery
        throw new Error(`unexpected table ${table}`)
      }),
    })

    await runActivationReminderJob()

    expect(ACTIVATION_DAY).toBe(2)
    expect(usersQuery.eq).toHaveBeenCalledWith('subscription_status', 'trialing')
    expect(usersQuery.is).toHaveBeenCalledWith('drip_unsubscribed_at', null)
    expect(usersQuery.gte).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/))
    expect(usersQuery.lte).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T23:59:59Z$/))

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const [args] = sendEmail.mock.calls[0]
    expect(args.to).toBe('priya.personal@example.com')
    expect(args.subject).toBe('One thing to do in Starting Monday today')
    expect(args.html).toContain('Priya, add your first target company.')
    expect(args.html).toContain('/dashboard/companies/new')
  })

  it('does nothing when no trial user signed up on the target day', async () => {
    const usersQuery = thenableQuery({ data: [], error: null })
    getSupabase.mockReturnValue({ from: vi.fn(() => usersQuery) })

    await runActivationReminderJob()

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('renders safely for a missing first name and escapes markup', () => {
    const { html } = buildCompanyNudgeEmail({ firstName: '<b>there</b>' })
    expect(html).toContain('&lt;b&gt;there&lt;/b&gt;, add your first target company.')
    expect(html).not.toContain('<b>there</b>')
  })
})
