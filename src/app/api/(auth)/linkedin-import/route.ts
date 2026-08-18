import { type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { checkBurstLimit } from '@/lib/burst-limit'
import { isRateLimited } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  if (!(await checkBurstLimit(userId))) {
    return Response.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
  }
  const supabase = await createClient()
  if (await isRateLimited(supabase, userId)) {
    return Response.json({ error: 'Monthly token limit reached.' }, { status: 429 })
  }

  let text: string
  try {
    const body = await request.json()
    text = typeof body.text === 'string' ? body.text.trim() : ''
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (text.length < 50) return Response.json({ error: 'Paste more of your profile; this is too short to extract from.' }, { status: 400 })
  if (text.length > 60000) text = text.slice(0, 60000)

  const message = await anthropic.messages.create({
    model: MODELS.sonnet,
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Extract structured career information from this LinkedIn profile text. Return ONLY a valid JSON object with no explanation, no markdown, no code fences.

Fields (use null for anything that cannot be confidently determined):
{
  "full_name": string | null,
  "current_title": string | null,
  "current_company": string | null,
  "positioning_summary": string | null,
  "resume_text": string | null,
  "beyond_resume": string | null,
  "target_titles": string | null,
  "career_entries": [
    {
      "company": string,
      "parent_company": string | null,
      "title": string,
      "start_year": string,
      "end_year": string | null,
      "key_outcome": string,
      "acquisition_note": string | null,
      "uncertain": boolean
    }
  ]
}

Rules:
- positioning_summary: 2-3 sentences, first person, executive-level narrative. What makes this person distinctive as a leader. If insufficient information, return null.
- resume_text: career history as plain text. Include company names, titles, date ranges, and key accomplishments. Preserve chronological order.
- beyond_resume: board seats, advisory roles, publications, patents, speaking engagements, community work, awards. Omit if none found.
- target_titles: comma-separated list of likely next-step executive titles based on career trajectory. Infer if not stated.
- career_entries: one entry per distinct role. Include all roles found, most recent first.
  - company: the specific legal entity where they worked
  - parent_company: if this company was acquired, merged, or is a subsidiary, name the parent or acquirer
  - title: exact title as listed
  - start_year: four-digit year (e.g. "2018")
  - end_year: four-digit year, or null if current role
  - key_outcome: one specific, quantified achievement from this role. If none stated, infer the most likely outcome from context.
  - acquisition_note: if the company was acquired, renamed, or merged during or after this tenure, describe it (e.g. "Glu Mobile was acquired by Electronic Arts in 2021")
  - uncertain: true if the company identity is ambiguous (acquisition in history, subsidiary relationship, company rename, date overlap, or title inconsistent with described scope)

LinkedIn profile text:
---
${text}
---`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  const match = raw.match(/\{[\s\S]*\}/)

  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      await logEvent(userId, 'linkedin_imported', { full_parse: true })
      captureServerEvent(userId, 'linkedin_imported', { full_parse: true })
      return Response.json(parsed)
    } catch {
      // fall through to raw-text fallback
    }
  }

  // Claude returned something unparseable. Return the paste text itself as resume_text
  // so the user's input is never lost. The frontend detects importThin and shows a soft notice.
  await logEvent(userId, 'linkedin_imported', { full_parse: false })
  captureServerEvent(userId, 'linkedin_imported', { full_parse: false })
  return Response.json({
    full_name: null,
    current_title: null,
    current_company: null,
    positioning_summary: null,
    resume_text: text.slice(0, 20000),
    beyond_resume: null,
    target_titles: null,
  })
}

