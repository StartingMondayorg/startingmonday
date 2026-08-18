/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function buildReleaseNotes(lines: string[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const normalized = lines.filter(Boolean).slice(0, 30)
  if (normalized.length === 0) {
    return `## Release ${today}\n\n- Routine reliability and quality updates.`
  }
  return `## Release ${today}\n\n${normalized.map(item => `- ${item}`).join('\n')}`
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))
    const changes = Array.isArray(body?.changes)
      ? body.changes.map((v: unknown) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
      : []

    const notes = buildReleaseNotes(changes)
    const { data } = await sb
      .from('release_note_runs')
      .insert({
        user_id: userId,
        notes_markdown: notes,
        details: { change_count: changes.length, source: 'ticket46' },
      })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, notes })
  } catch (error) {
    console.error('[engineering.release-notes] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
