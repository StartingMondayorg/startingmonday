import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { APP_URL } from '@/lib/config'

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
const DEFAULT_CALENDAR_ID = 'primary'
const POSTING_REMINDER_ICS_PATH = resolve(process.cwd(), 'docs/operations/reminders/startingmonday-posting-reminders.ics')
const GOOGLE_CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.events'

export type GoogleCalendarIntegrationRow = {
  id: string
  user_id: string
  provider: string
  calendar_id: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  scope: string | null
  active: boolean
  last_synced_at: string | null
  created_at?: string
  updated_at?: string
}

export type GoogleCalendarReminder = {
  uid: string
  summary: string
  description: string
  startAt: string
  endAt: string
}

function sanitizeText(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function unfoldIcsLines(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const unfolded: string[] = []
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1)
    } else {
      unfolded.push(line)
    }
  }
  return unfolded
}

function parseIcsDate(value: string): string {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/)
  if (!match) throw new Error(`Unsupported calendar date: ${value}`)
  const [, year, month, day, hour, minute, second, z] = match
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${z ? 'Z' : ''}`
}

export async function loadPostingReminderCalendar(): Promise<GoogleCalendarReminder[]> {
  const raw = await readFile(POSTING_REMINDER_ICS_PATH, 'utf8')
  const lines = unfoldIcsLines(raw)
  const reminders: GoogleCalendarReminder[] = []

  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }

    if (line === 'END:VEVENT') {
      if (current?.SUMMARY && current?.DTSTART && current?.DTEND) {
        reminders.push({
          uid: current.UID ?? randomUUID(),
          summary: sanitizeText(current.SUMMARY),
          description: sanitizeText(current.DESCRIPTION ?? ''),
          startAt: parseIcsDate(current.DTSTART),
          endAt: parseIcsDate(current.DTEND),
        })
      }
      current = null
      continue
    }

    if (!current) continue
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex)
    const value = line.slice(colonIndex + 1)
    current[key] = value
  }

  return reminders.sort((left, right) => left.startAt.localeCompare(right.startAt))
}

export function buildGoogleCalendarAuthUrl(opts: { state: string; redirectUri?: string }): string {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not set')

  const redirectUri = opts.redirectUri ?? `${APP_URL}/api/google-calendar/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: opts.state,
  })

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`
}

async function exchangeToken(payload: Record<string, string>): Promise<Record<string, unknown>> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google Calendar OAuth env vars are not configured')

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...payload,
    }),
  })

  const bodyText = await response.text()
  let body: Record<string, unknown> = {}
  try {
    body = bodyText ? JSON.parse(bodyText) : {}
  } catch {
    body = { raw: bodyText }
  }

  if (!response.ok) {
    throw new Error((body.error_description as string | undefined) ?? (body.error as string | undefined) ?? `Google token exchange failed with status ${response.status}`)
  }

  return body
}

export async function exchangeGoogleCalendarCode(code: string, redirectUri?: string): Promise<{
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  scope: string | null
}> {
  const token = await exchangeToken({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri ?? `${APP_URL}/api/google-calendar/callback`,
  })

  const expiresIn = Number(token.expires_in ?? 0)
  return {
    access_token: String(token.access_token ?? ''),
    refresh_token: typeof token.refresh_token === 'string' ? token.refresh_token : null,
    expires_at: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scope: typeof token.scope === 'string' ? token.scope : null,
  }
}

export async function refreshGoogleCalendarAccessToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  scope: string | null
}> {
  const token = await exchangeToken({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const expiresIn = Number(token.expires_in ?? 0)
  return {
    access_token: String(token.access_token ?? ''),
    refresh_token: typeof token.refresh_token === 'string' ? token.refresh_token : null,
    expires_at: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scope: typeof token.scope === 'string' ? token.scope : null,
  }
}

async function googleCalendarRequest(opts: {
  accessToken: string
  method: 'POST' | 'PATCH'
  path: string
  body: Record<string, unknown>
}): Promise<{ ok: boolean; status: number; body: Record<string, unknown> | null }> {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${opts.path}`, {
    method: opts.method,
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(opts.body),
  })

  const text = await response.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }

  return { ok: response.ok, status: response.status, body }
}

async function requestCalendarApi(opts: {
  admin: SupabaseClient
  integration: GoogleCalendarIntegrationRow
  method: 'POST' | 'PATCH'
  path: string
  body: Record<string, unknown>
}): Promise<Record<string, unknown>> {
  let accessToken = opts.integration.access_token
  if (!accessToken) {
    throw new Error('Google Calendar access token missing')
  }

  const perform = async (token: string) => googleCalendarRequest({ accessToken: token, method: opts.method, path: opts.path, body: opts.body })

  let result = await perform(accessToken)
  if (result.ok && result.body) return result.body

  if (result.status === 401 && opts.integration.refresh_token) {
    const refreshed = await refreshGoogleCalendarAccessToken(opts.integration.refresh_token)
    accessToken = refreshed.access_token
    await opts.admin
      .from('google_calendar_integrations')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token ?? opts.integration.refresh_token,
        token_expires_at: refreshed.expires_at,
        scope: refreshed.scope ?? opts.integration.scope,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opts.integration.id)

    result = await perform(accessToken)
    if (result.ok && result.body) return result.body
  }

  const errorMessage = (() => {
    const maybeError = result.body?.error
    if (typeof maybeError === 'object' && maybeError !== null) {
      const message = (maybeError as { message?: unknown }).message
      if (typeof message === 'string') return message
    }
    return null
  })()

  const message = errorMessage ?? `Google Calendar API request failed with status ${result.status}`

  throw new Error(message)
}

function buildCalendarEventBody(reminder: GoogleCalendarReminder): Record<string, unknown> {
  return {
    summary: reminder.summary,
    description: reminder.description,
    start: { dateTime: reminder.startAt, timeZone: 'UTC' },
    end: { dateTime: reminder.endAt, timeZone: 'UTC' },
  }
}

export async function syncGoogleCalendarIntegration(admin: SupabaseClient, integration: GoogleCalendarIntegrationRow): Promise<{
  created: number
  updated: number
  skipped: number
}> {
  const reminders = await loadPostingReminderCalendar()
  if (reminders.length === 0) return { created: 0, updated: 0, skipped: 0 }

  const { data: existingRows } = await admin
    .from('google_calendar_events')
    .select('id, source_uid, google_event_id, summary, start_at, end_at, description')
    .eq('integration_id', integration.id)
    .eq('source_type', 'posting_reminder')

  const existingBySourceUid = new Map<string, { id: string; source_uid: string; google_event_id: string; summary: string; start_at: string; end_at: string; description: string | null }>()
  for (const row of existingRows ?? []) {
    existingBySourceUid.set(row.source_uid, row)
  }

  let created = 0
  let updated = 0
  const skipped = 0

  for (const reminder of reminders) {
    const body = buildCalendarEventBody(reminder)
    const existing = existingBySourceUid.get(reminder.uid)

    if (existing?.google_event_id) {
      try {
        await requestCalendarApi({
          admin,
          integration,
          method: 'PATCH',
          path: `/calendars/${encodeURIComponent(integration.calendar_id ?? DEFAULT_CALENDAR_ID)}/events/${encodeURIComponent(existing.google_event_id)}?sendUpdates=none`,
          body,
        })

        await admin
          .from('google_calendar_events')
          .update({
            summary: reminder.summary,
            start_at: reminder.startAt,
            end_at: reminder.endAt,
            description: reminder.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        updated++
        continue
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!/404|not found/i.test(message)) throw error
      }
    }

    const createdEvent = await requestCalendarApi({
      admin,
      integration,
      method: 'POST',
      path: `/calendars/${encodeURIComponent(integration.calendar_id ?? DEFAULT_CALENDAR_ID)}/events?sendUpdates=none`,
      body,
    })

    const googleEventId = typeof createdEvent.id === 'string' ? createdEvent.id : randomUUID()
    await admin
      .from('google_calendar_events')
      .upsert({
        integration_id: integration.id,
        source_type: 'posting_reminder',
        source_uid: reminder.uid,
        google_event_id: googleEventId,
        summary: reminder.summary,
        start_at: reminder.startAt,
        end_at: reminder.endAt,
        description: reminder.description,
        event_status: 'confirmed',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'integration_id,source_type,source_uid',
        ignoreDuplicates: false,
      })

    created++
  }

  await admin
    .from('google_calendar_integrations')
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: true,
    })
    .eq('id', integration.id)

  return { created, updated, skipped }
}

export { DEFAULT_CALENDAR_ID, GOOGLE_CALENDAR_SCOPES }
