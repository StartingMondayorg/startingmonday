import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'

type AnthropicDocumentBlock = {
  type: 'document'
  source: {
    type: 'base64'
    media_type: 'application/pdf'
    data: string
  }
}

type AnthropicTextBlock = {
  type: 'text'
  text: string
}

const MAX_BYTES = 5 * 1024 * 1024
const MAX_TEXT = 12000

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth
  const supabase = await createClient()

  if (await isRateLimited(supabase, userId)) {
    return NextResponse.json({ error: 'Monthly token limit reached.' }, { status: 429 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (5 MB max)' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
  if (!isPdf) return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 415 })

  let text: string
  try {
    // Use Claude's native PDF support for robust extraction from LinkedIn exports.
    const content: Array<AnthropicDocumentBlock | AnthropicTextBlock> = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') },
      },
      {
        type: 'text',
        text: 'Extract all text from this LinkedIn profile PDF exactly as it appears. Output only extracted text with no commentary.',
      },
    ]

    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    })
    const block = response.content[0]
    text = block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[upload-linkedin] extraction failed:', err)
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 422 })
  }

  text = text.replace(/\x00/g, '').trim()
  if (!text) return NextResponse.json({ error: 'No text found in file' }, { status: 422 })
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT)

  let { error } = await supabase
    .from('user_profiles')
    .update({ linkedin_raw_text: text })
    .eq('user_id', userId)

  // Compatibility fallback while linkedin_raw_text migration rolls out everywhere.
  if (error && error.message.toLowerCase().includes('linkedin_raw_text')) {
    const fallback = await supabase
      .from('user_profiles')
      .update({ linkedin_about: text })
      .eq('user_id', userId)
    error = fallback.error
  }

  if (error) {
    console.error('[upload-linkedin] supabase error:', JSON.stringify(error))
    return NextResponse.json({ error: 'Failed to save LinkedIn text', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, text })
}
