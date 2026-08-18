import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { anthropic, MODELS } from '@/lib/anthropic'

const ALL_STARTING_MONDAY = 'C0B37UT271B'

async function postSlack(token: string | null | undefined, text: string) {
  if (!token) {
    console.warn('[ideas-monthly] Slack skipped: SLACK_USER_TOKEN not configured')
    return { ok: false, skipped: true as const }
  }

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: ALL_STARTING_MONDAY, text }),
  })
  const payload = await res.json().catch(() => ({})) as { ok?: boolean; error?: string }
  if (!payload.ok) console.error('[ideas-monthly] Slack error:', payload.error)
  return { ok: Boolean(payload.ok), skipped: false as const, error: payload.error ?? null }
}

const CATEGORY_LABELS: Record<string, string> = {
  feature_request: 'Feature',
  ui_ux: 'UI/UX',
  bug: 'Bug',
  performance: 'Performance',
  other: 'Other',
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const slackToken = process.env.SLACK_USER_TOKEN
    const admin = createAdminClient()

    // Prior calendar month
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

    type Submission = { id: string; name: string | null; email: string; category: string; body: string }
    type Rated = Submission & { score: number; rationale: string }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (admin as any)
      .from('idea_submissions')
      .select('id, name, email, category, body')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString())

    if (error) {
      console.error('[ideas-monthly] fetch error:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const submissions = (rawData ?? []) as Submission[]

    if (submissions.length === 0) {
      const slackResult = await postSlack(slackToken, `*Ideas Monthly Report -${monthLabel}*\nNo submissions this month.`)
      return NextResponse.json({ ok: true, month: monthLabel, count: 0, slack_skipped: slackResult.skipped })
    }

    const rated: Rated[] = []

    for (const sub of submissions) {
      try {
        const msg = await anthropic.messages.create({
          model: MODELS.haiku,
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Rate this product idea for a B2B SaaS executive job search platform. Return only JSON.

Category: ${CATEGORY_LABELS[sub.category] ?? sub.category}
Idea: ${sub.body}

{"score": <1-10 integer>, "rationale": "<one sentence>"}`,
          }],
        })
        const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0]) as { score: number; rationale: string }
          rated.push({ ...sub, score: parsed.score, rationale: parsed.rationale })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any).from('idea_submissions').update({
            ai_rating: { score: parsed.score, rationale: parsed.rationale },
            ai_rated_at: new Date().toISOString(),
          }).eq('id', sub.id)
        } else {
          rated.push({ ...sub, score: 0, rationale: 'Rating unavailable' })
        }
      } catch (err) {
        console.error('[ideas-monthly] rating error for', sub.id, err)
        rated.push({ ...sub, score: 0, rationale: 'Rating failed' })
      }
    }

    const sorted = [...rated].sort((a, b) => b.score - a.score)
    const rows = sorted.map((s, i) => {
      const display = s.name?.trim() ? s.name.trim() : s.email
      const preview = s.body.length > 120 ? s.body.slice(0, 120) + '...' : s.body
      return `${i + 1}. *[${s.score}/10]* _(${CATEGORY_LABELS[s.category] ?? s.category})_ ${display}\n   ${preview}`
    }).join('\n\n')

    const report = `*Ideas Monthly Report -${monthLabel}*\n${submissions.length} submission${submissions.length !== 1 ? 's' : ''} received.\n\n${rows}`
    const reportSlack = await postSlack(slackToken, report)

    const uniqueEmails = [...new Map(submissions.map(s => [s.email, s])).values()]
    const winner = uniqueEmails[Math.floor(Math.random() * uniqueEmails.length)]
    const winnerName = winner.name?.trim() || '(no name provided)'
    const winnerSlack = await postSlack(slackToken, `*${monthLabel} Gift Card Winner*\nName: ${winnerName}\nEmail: ${winner.email}\n\nRemember to send the $25 Amazon gift card!`)

    return NextResponse.json({
      ok: true,
      month: monthLabel,
      count: submissions.length,
      winner_email: winner.email,
      slack_skipped: reportSlack.skipped || winnerSlack.skipped,
    })
  } catch (error) {
    console.error('[ideas-monthly] unexpected error:', error)
    return NextResponse.json({ error: 'Ideas monthly route failed' }, { status: 500 })
  }
}
