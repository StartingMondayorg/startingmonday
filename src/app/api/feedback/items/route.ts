import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/require-auth'
import { FeedbackSubmitSchema, firstZodError } from '@/lib/schemas'
import { NextRequest, NextResponse } from 'next/server'
import { withApiTelemetry } from '@/lib/telemetry'
import { sendEmail } from '@/lib/email/email'
import { getNotifyEmails } from '@/lib/email/owner-email'
import { anthropic, MODELS, TEMP } from '@/lib/ai/anthropic'

type FeedbackListRow = Record<string, unknown> & { id: string }
type FeedbackVoteRow = { item_id: string }
type FeedbackInsertQuery = {
  insert: (values: Record<string, unknown>) => {
    select: (columns: string) => {
      single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>
    }
  }
}

async function getHandler(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'recent' // recent, votes, comments
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('feedback_items')
      .select('*', { count: 'exact' })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
    }

    // Apply sorting
    if (sortBy === 'votes') {
      query = query.order('vote_count', { ascending: false })
    } else if (sortBy === 'comments') {
      query = query.order('comment_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[feedback] list error:', error)
      return NextResponse.json({ items: [], count: 0, degraded: true }, { status: 200 })
    }

    // Check user votes for each item
    const items = (data || []) as unknown as FeedbackListRow[]
    const itemIds = items.map((item) => item.id)

    // Resolve author names separately: feedback_items has no FK relationship
    // to user_profiles, so an embedded join fails in PostgREST. Names are
    // cosmetic - failures here must not break the list.
    const namesByUser: Record<string, string | null> = {}
    try {
      const authorIds = [...new Set(items.map((item) => item.user_id).filter(Boolean))] as string[]
      if (authorIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', authorIds)
        for (const row of (profileRows ?? []) as Array<{ user_id: string; full_name: string | null }>) {
          namesByUser[row.user_id] = row.full_name
        }
      }
    } catch {
      // ignore - list renders without author names
    }

    const withNames = items.map((item) => ({
      ...item,
      user_profiles: { full_name: namesByUser[String(item.user_id ?? '')] ?? null },
    }))

    if (itemIds.length > 0) {
      const { data: userVotes } = await supabase
        .from('feedback_votes')
        .select('item_id')
        .in('item_id', itemIds)
        .eq('user_id', user.id)

      const votes = (userVotes || []) as unknown as FeedbackVoteRow[]
      const votedItemIds = new Set(votes.map((v) => v.item_id))
      const enhancedData = withNames.map((item) => ({
        ...item,
        user_voted: votedItemIds.has(item.id),
      }))

      return NextResponse.json({ items: enhancedData, count: count || 0 })
    }

    return NextResponse.json({ items: withNames, count: count || 0 })
  } catch (err) {
    console.error('[feedback] list exception:', err)
    return NextResponse.json({ items: [], count: 0, degraded: true }, { status: 200 })
  }
}

async function postHandler(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { userId } = auth

  const authJson = (payload: unknown, status: number) =>
    NextResponse.json(payload, { status })

  try {
    const body = await req.json()
    
    // Validate input
    const parseResult = FeedbackSubmitSchema.safeParse(body)
    if (!parseResult.success) {
      return authJson(
        { error: firstZodError(parseResult.error) },
        400
      )
    }

    const { title, body: feedbackBody, category, screenshot_url } = parseResult.data

    // Check rate limit: max 5 feedback submissions per day per user
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('feedback_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', oneDayAgo)

    if ((recentCount || 0) >= 5) {
      return authJson(
        { error: 'You can submit a maximum of 5 feedback items per day' },
        429
      )
    }

    const feedbackItemsQuery = supabase.from('feedback_items') as unknown as FeedbackInsertQuery
    const { data: feedbackItem, error } = await feedbackItemsQuery
      .insert({
        type: 'feedback',
        title,
        body: feedbackBody,
        category,
        screenshot_url: screenshot_url || null,
        user_id: userId,
        status: 'new',
      })
      .select('*')
      .single()

    if (error) {
      console.error('[feedback] submit error:', error)
      return authJson({ error: 'Failed to submit feedback' }, 500)
    }

    void notifyAdmins(userId, title, feedbackBody, category)

    return authJson(
      {
        item: feedbackItem,
        message: 'Thank you for your feedback! We\'ll review it within 24 hours.'
      },
      201
    )
  } catch (err) {
    console.error('[feedback] submit exception:', err)
    return authJson({ error: 'Internal server error' }, 500)
  }
}

async function notifyAdmins(userId: string, title: string, feedbackBody: string, category: string) {
  const notifyEmails = getNotifyEmails()
  if (notifyEmails.length === 0) return

  try {
    const admin = createAdminClient()
    const [{ data: authData }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from('user_profiles').select('full_name').eq('user_id', userId).maybeSingle(),
    ])

    const userEmail = authData.user?.email ?? 'unknown'
    const userName = (profile as { full_name?: string | null } | null)?.full_name ?? null

    const sentiment = await analyzeSentiment(`${title}\n\n${feedbackBody}`)

    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })

    const nameRow = userName
      ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;">Name</td><td>${userName}</td></tr>`
      : ''

    await sendEmail({
      to: notifyEmails.length === 1 ? notifyEmails[0] : notifyEmails,
      subject: 'New Feedback!',
      bypassCouncil: true,
      html: `
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 12px 0;">
          Heads up &#8212; you've got new feedback.
        </p>
        <table style="font-family:sans-serif;font-size:13px;color:#334155;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Email</td><td><strong>${userEmail}</strong></td></tr>
          ${nameRow}
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Category</td><td>${category}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Time</td><td>${now} CT</td></tr>
        </table>
        <p style="font-family:sans-serif;font-size:13px;color:#64748b;margin:0 0 4px 0;font-weight:600;">${title}</p>
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 16px 0;background:#f8fafc;padding:12px;border-left:3px solid #3b82f6;border-radius:2px;">
          ${feedbackBody.replace(/\n/g, '<br>')}
        </p>
        <p style="font-family:sans-serif;font-size:13px;color:#64748b;margin:0 0 4px 0;font-weight:600;">Analysis</p>
        <p style="font-family:sans-serif;font-size:13px;color:#334155;margin:0;white-space:pre-line;">${sentiment}</p>
      `,
    })
  } catch (err) {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'feedback_notify_error',
      error: String(err),
    }))
  }
}

async function analyzeSentiment(text: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 300,
      temperature: TEMP.extract,
      messages: [{
        role: 'user',
        content: `Analyze this user feedback for an executive job search platform.

Feedback: "${text}"

Respond in exactly this format (no extra text):
Sentiment: [positive | negative | mixed]
Key takeaways:
- [takeaway 1]
- [takeaway 2]
- [takeaway 3 if warranted]`,
      }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : 'Analysis unavailable'
  } catch {
    return 'Analysis unavailable'
  }
}

export const GET = withApiTelemetry('/api/feedback/items', getHandler)
export const POST = withApiTelemetry('/api/feedback/items', postHandler)
