import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'

// GET: list speakers with appearances, optional filters: ?status=&q=&conference=&year=
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const q = searchParams.get('q')?.trim()
  const conference = searchParams.get('conference')
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null

  const admin = createAdminClient()

  let query = admin
    .from('conference_speakers')
    .select('*, conference_appearances(conference_name, conference_year, topic, session_type)')
    .order('priority', { ascending: true })
    .order('full_name', { ascending: true })

  if (status) query = query.eq('outreach_status', status)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let speakers = data ?? []

  // Filter by conference or year after fetch (appearance join makes SQL filter awkward)
  if (conference) {
    speakers = speakers.filter(s =>
      s.conference_appearances?.some((a: { conference_name: string }) =>
        a.conference_name.toLowerCase().includes(conference.toLowerCase())
      )
    )
  }
  if (year) {
    speakers = speakers.filter(s =>
      s.conference_appearances?.some((a: { conference_year: number }) => a.conference_year === year)
    )
  }

  return withAuthCookies(NextResponse.json({ speakers }), auth)
}

// POST: import speakers from CSV body (text/csv or multipart with "file" field)
// Expected CSV columns (order flexible, header row required):
// full_name, first_name, last_name, title, company, linkedin_url, sector, notes, priority,
// conference_name, year, topic, session_type
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let csvText = ''
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file field in form data' }, { status: 400 })
    }
    csvText = await (file as Blob).text()
  } else {
    csvText = await request.text()
  }

  if (!csvText.trim()) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })

  const rows = parseCSV(csvText)
  if (rows.length === 0) return NextResponse.json({ error: 'No data rows' }, { status: 400 })

  const admin = createAdminClient()
  let speakersUpserted = 0
  let appearancesInserted = 0
  const errors: string[] = []

  for (const row of rows) {
    const fullName = (row.full_name ?? '').trim()
    if (!fullName) continue

    // Build speaker upsert payload
    const speakerPayload: { full_name: string; [key: string]: unknown } = {
      full_name:   fullName,
      first_name:  (row.first_name ?? '').trim() || splitName(fullName).first || null,
      last_name:   (row.last_name ?? '').trim()  || splitName(fullName).last  || null,
      title:       (row.title ?? '').trim()       || null,
      company:     (row.company ?? '').trim()     || null,
      sector:      (row.sector ?? '').trim()      || null,
      notes:       (row.notes ?? '').trim()       || null,
      priority:    parseInt(row.priority ?? '', 10) || 2,
      updated_at:  new Date().toISOString(),
    }
    if ((row.linkedin_url ?? '').trim()) {
      speakerPayload.linkedin_url = row.linkedin_url.trim()
    }

    // Upsert speaker: conflict on linkedin_url if present, else insert/ignore by name+company
    let speakerId: string | null = null

    if (speakerPayload.linkedin_url) {
      const { data: upserted, error: uErr } = await admin
        .from('conference_speakers')
        .upsert(speakerPayload, { onConflict: 'linkedin_url', ignoreDuplicates: false })
        .select('id')
        .single()
      if (uErr) { errors.push(`${fullName}: ${uErr.message}`); continue }
      speakerId = upserted.id
    } else {
      // Check if (full_name, company) already exists
      const company = (speakerPayload.company ?? '') as string
      const { data: existing } = await admin
        .from('conference_speakers')
        .select('id')
        .eq('full_name', fullName)
        .eq('company', company)
        .maybeSingle()
      if (existing) {
        await admin.from('conference_speakers').update(speakerPayload).eq('id', existing.id)
        speakerId = existing.id
      } else {
        const { data: inserted, error: iErr } = await admin
          .from('conference_speakers')
          .insert(speakerPayload)
          .select('id')
          .single()
        if (iErr) { errors.push(`${fullName}: ${iErr.message}`); continue }
        speakerId = inserted.id
      }
    }

    speakersUpserted++

    // Insert conference appearance if columns present
    const conferenceName = (row.conference_name ?? '').trim()
    const yearVal = parseInt(row.year ?? '', 10)
    if (conferenceName && yearVal > 2000) {
      const { error: aErr } = await admin
        .from('conference_appearances')
        .upsert({
          speaker_id:      speakerId,
          conference_name: conferenceName,
          conference_year: yearVal,
          topic:           (row.topic ?? '').trim() || null,
          session_type:    (row.session_type ?? '').trim() || null,
        }, { onConflict: 'speaker_id,conference_name,conference_year', ignoreDuplicates: true })
      if (aErr) {
        errors.push(`${fullName} appearance: ${aErr.message}`)
      } else {
        appearancesInserted++
      }
    }
  }

  return withAuthCookies(NextResponse.json({
    ok: true,
    speakersUpserted,
    appearancesInserted,
    errors: errors.slice(0, 20),
  }), auth)
}

// ── helpers ────────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? ''
    }
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result.map(s => s.trim())
}

function splitName(fullName: string): { first: string | null; last: string | null } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { first: null, last: null }
  if (parts.length === 1) return { first: parts[0], last: null }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
