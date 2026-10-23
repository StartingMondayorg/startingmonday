import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import {
  canUserSeeAdminHeader,
  getStaffMember,
  hasAdminHeaderAccess,
  hasConfirmedEmail,
  isDevStaffBypassEnabled,
  type StaffAuthUser,
} from './staff'

const mockCreateAdminClient = vi.mocked(createAdminClient)

function authUser(email: string | undefined, confirmed: boolean): StaffAuthUser {
  return {
    aud: 'authenticated',
    email,
    email_confirmed_at: confirmed ? '2026-01-01T00:00:00.000Z' : undefined,
  }
}

function mockStaffRow(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  mockCreateAdminClient.mockReturnValue({ from } as never)
  return { from, eq }
}

const ADMIN_ROW = {
  id: 'staff-1',
  email: 'admin@example.com',
  role: 'admin',
  permissions: {},
  created_at: '2026-01-01T00:00:00.000Z',
  created_by: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('staff access helpers', () => {
  it('grants admin header access only to owner/admin roles', () => {
    expect(hasAdminHeaderAccess({ role: 'owner' } as never)).toBe(true)
    expect(hasAdminHeaderAccess({ role: 'admin' } as never)).toBe(true)
    expect(hasAdminHeaderAccess({ role: 'viewer' } as never)).toBe(false)
    expect(hasAdminHeaderAccess(null)).toBe(false)
  })

  it('normalizes the confirmed user email and returns the stored staff member', async () => {
    const { eq } = mockStaffRow(ADMIN_ROW)

    const staff = await getStaffMember(authUser('  ADMIN@Example.com  ', true))

    expect(eq).toHaveBeenCalledWith('email', 'admin@example.com')
    expect(staff?.role).toBe('admin')
  })

  it('never resolves staff for a user whose email is not confirmed', async () => {
    const { from } = mockStaffRow(ADMIN_ROW)

    await expect(getStaffMember(authUser('admin@example.com', false))).resolves.toBeNull()
    await expect(canUserSeeAdminHeader(authUser('admin@example.com', false))).resolves.toBe(false)
    expect(from).not.toHaveBeenCalled()
  })

  it('returns null for a missing user or a user without an email', async () => {
    const { from } = mockStaffRow(ADMIN_ROW)

    await expect(getStaffMember(null)).resolves.toBeNull()
    await expect(getStaffMember(undefined)).resolves.toBeNull()
    await expect(getStaffMember(authUser(undefined, true))).resolves.toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('hasConfirmedEmail requires both an email and a confirmation timestamp', () => {
    expect(hasConfirmedEmail(authUser('a@example.com', true))).toBe(true)
    expect(hasConfirmedEmail(authUser('a@example.com', false))).toBe(false)
    expect(hasConfirmedEmail(authUser('   ', true))).toBe(false)
    expect(hasConfirmedEmail(null)).toBe(false)
  })

  it('keeps the legacy email-string lookup for non-authorization callers', async () => {
    const { eq } = mockStaffRow(ADMIN_ROW)

    const staff = await getStaffMember('  ADMIN@Example.com  ')

    expect(eq).toHaveBeenCalledWith('email', 'admin@example.com')
    expect(staff?.role).toBe('admin')
  })

  it('does not grant the development owner fallback from NODE_ENV alone', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockStaffRow(null)

    expect(isDevStaffBypassEnabled()).toBe(false)
    await expect(getStaffMember(authUser('anyone@example.com', true))).resolves.toBeNull()
    await expect(getStaffMember('')).resolves.toBeNull()
  })

  it('ignores DEV_STAFF_BYPASS outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DEV_STAFF_BYPASS', '1')
    mockStaffRow(null)

    expect(isDevStaffBypassEnabled()).toBe(false)
    await expect(getStaffMember(authUser('anyone@example.com', true))).resolves.toBeNull()
  })

  it('returns the development owner fallback only with the explicit DEV_STAFF_BYPASS opt-in', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DEV_STAFF_BYPASS', '1')
    vi.stubEnv('DEV_AUTH_EMAIL', 'dev@example.com')
    mockStaffRow(null)

    expect(isDevStaffBypassEnabled()).toBe(true)
    const staff = await getStaffMember('')

    expect(staff?.role).toBe('owner')
    expect(staff?.email).toBe('dev@example.com')
  })

  it('canUserSeeAdminHeader delegates to staff lookup and role check', async () => {
    mockStaffRow({ ...ADMIN_ROW, id: 'staff-2', email: 'viewer@example.com', role: 'viewer' })

    await expect(canUserSeeAdminHeader(authUser('viewer@example.com', true))).resolves.toBe(false)
  })
})

describe('staff authorization call sites', () => {
  // Bare-email lookups cannot prove the caller owns the address. Pass the
  // Supabase auth user instead. Entries here are owned by other workstreams.
  const ALLOWED_EMAIL_STRING_CALLERS = new Set([
    'src/app/(dashboard)/dashboard/page.tsx',
  ])

  function listSourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) return listSourceFiles(full)
      return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : []
    })
  }

  it('passes the auth user, not a bare email, to staff lookups', () => {
    const root = process.cwd()
    const offenders = listSourceFiles(join(root, 'src'))
      .map((file) => relative(root, file).split(sep).join('/'))
      .filter((file) => !ALLOWED_EMAIL_STRING_CALLERS.has(file))
      .filter((file) => /(getStaffMember|canUserSeeAdminHeader)\(\s*[^)]*\.email\b/.test(readFileSync(join(root, file), 'utf8')))

    expect(offenders).toEqual([])
  })
})