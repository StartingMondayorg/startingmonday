import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { withApiTelemetry } from '@/lib/telemetry'

type NotesPayload = {
  contact_id?: string
  note_type?: 'research' | 'conversation' | 'intro_path' | 'interview' | 'personal_context' | 'ai_summary' | 'general'
  body?: string
  pinned?: boolean
}

async function postHandler(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const payload = await req.json().catch(() => ({})) as NotesPayload

  const contactId = typeof payload.contact_id === 'string' ? payload.contact_id.trim() : ''
  const noteBody = typeof payload.body === 'string' ? payload.body.trim() : ''
  const noteType = payload.note_type ?? 'general'
  const pinned = payload.pinned === true

  if (!contactId) {
    return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
  }

  if (!noteBody) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, notes, company_id')
    .eq('id', contactId)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (contactError) {
    return NextResponse.json({ error: 'Failed to verify contact ownership' }, { status: 500 })
  }

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from('contact_notes' as never)
    .insert({
      user_id: auth.userId,
      contact_id: contactId,
      note_type: noteType,
      body: noteBody,
      source: 'user',
      pinned,
    } as never)
    .select('id, note_type, body, pinned, created_at')
    .single()

  if (!insertError && inserted) {
    const eventProps = {
      contact_id: contactId,
      company_id: contact.company_id ?? null,
      action_type: 'note_added',
      action_channel: 'notes',
      note_type: noteType,
      source: 'relationship_note',
      chain_stage: 'relationship_action',
    }
    await logEvent(auth.userId, 'briefing_action_clicked', eventProps)
    captureServerEvent(auth.userId, 'briefing_action_clicked', eventProps)
    return NextResponse.json({ ok: true, note: inserted }, { status: 201 })
  }

  // Graceful fallback before migration rollout: append into contacts.notes.
  if ((insertError as { code?: string } | null)?.code === '42P01') {
    const stamp = new Date().toISOString().slice(0, 10)
    const existing = typeof contact.notes === 'string' ? contact.notes.trim() : ''
    const block = `[${stamp}] (${noteType}) ${noteBody}`
    const merged = existing ? `${existing}\n${block}` : block

    const { error: fallbackError } = await supabase
      .from('contacts')
      .update({ notes: merged })
      .eq('id', contactId)
      .eq('user_id', auth.userId)

    if (fallbackError) {
      return NextResponse.json({ error: 'Failed to store note fallback' }, { status: 500 })
    }

    const eventProps = {
      contact_id: contactId,
      company_id: contact.company_id ?? null,
      action_type: 'note_added',
      action_channel: 'notes',
      note_type: noteType,
      source: 'contacts_notes_fallback',
      chain_stage: 'relationship_action',
    }
    await logEvent(auth.userId, 'briefing_action_clicked', eventProps)
    captureServerEvent(auth.userId, 'briefing_action_clicked', eventProps)

    return NextResponse.json({ ok: true, fallback: 'contacts.notes' }, { status: 201 })
  }

  return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
}

export const POST = withApiTelemetry('/api/relationships/notes', postHandler)
