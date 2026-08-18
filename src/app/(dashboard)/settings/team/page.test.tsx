import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'user_1', email: 'coach@example.com' } as { id: string; email: string | null } | null,
  partner: {
    id: 'partner_1',
    name: 'Nash Transition Group',
    email: 'coach@example.com',
    user_id: 'user_1',
    white_label_brand_name: null,
    white_label_track_id: null,
    white_label_tier_id: null,
    white_label_primary_color: null,
    white_label_accent_color: null,
    white_label_support_email: null,
    white_label_logo_url: null,
  } as Record<string, unknown> | null,
  programSettingsRow: {
    default_program: 'outplacement_boutique',
    sponsor_template_variant: 'enterprise_board',
    cohort_naming_prefix: 'NTG',
    weekly_summary_day: 'monday',
  } as Record<string, unknown> | null,
  seats: [] as Array<Record<string, unknown>>,
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children }: { children: unknown }) => children,
}))

vi.mock('./team-settings', () => ({
  TeamSettings: () => null,
}))

vi.mock('@/app/(dashboard)/settings/_components/coach-access-manager', () => ({
  ClientCoachAccessManager: () => null,
}))

vi.mock('@/lib/staff', () => ({
  canUserSeeAdminHeader: async () => false,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: (table: string) => {
      if (table === 'team_seats') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: state.seats, error: null }),
            }),
          }),
        }
      }

      return {
        select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
      }
    },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'partners') {
        return {
          select: () => ({
            eq: (column: string) => {
              const chain = {
                eq: () => chain,
                maybeSingle: async () => ({ data: column === 'user_id' ? state.partner : null, error: null }),
              }
              return chain
            },
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        }
      }

      if (table === 'partner_program_settings') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: state.programSettingsRow, error: null }) }),
          }),
        }
      }

      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: () => ({ single: async () => ({ data: null, error: null }) }),
          }),
        }
      }

      if (table === 'companies' || table === 'briefs') {
        return {
          select: () => ({
            eq: () => ({ is: async () => ({ count: 0, error: null }) }),
          }),
        }
      }

      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }
    },
  }),
}))

import TeamSettingsPage from './page'

function findProgramSettingsProps(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null

  const maybeElement = node as { props?: { children?: unknown; programSettings?: unknown } }
  if (maybeElement.props && Object.prototype.hasOwnProperty.call(maybeElement.props, 'programSettings')) {
    return maybeElement.props as Record<string, unknown>
  }

  const children = maybeElement.props?.children
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findProgramSettingsProps(child)
      if (found) return found
    }
    return null
  }

  return findProgramSettingsProps(children)
}

describe('team settings page bootstrap', () => {
  beforeEach(() => {
    state.user = { id: 'user_1', email: 'coach@example.com' }
    state.partner = {
      id: 'partner_1',
      name: 'Nash Transition Group',
      email: 'coach@example.com',
      user_id: 'user_1',
      white_label_brand_name: null,
      white_label_track_id: null,
      white_label_tier_id: null,
      white_label_primary_color: null,
      white_label_accent_color: null,
      white_label_support_email: null,
      white_label_logo_url: null,
    }
    state.programSettingsRow = {
      default_program: 'outplacement_boutique',
      sponsor_template_variant: 'enterprise_board',
      cohort_naming_prefix: 'NTG',
      weekly_summary_day: 'monday',
    }
  })

  it('passes resolved partner program settings into TeamSettings', async () => {
    const tree = await TeamSettingsPage()
    const props = findProgramSettingsProps(tree)

    expect(props).toBeTruthy()
    expect(props?.programSettings).toMatchObject({
      defaultProgram: 'outplacement_boutique',
      sponsorTemplateVariant: 'enterprise_board',
      cohortNamingPrefix: 'NTG',
      weeklySummaryDay: 'monday',
    })
  })
})
