import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { extractLinkedInProfilePdfText, LinkedInProfilePdfError } from '@/lib/linkedin-profile-pdf'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const formData = await request.formData().catch(() => null)
    if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await extractLinkedInProfilePdfText(file)
    return NextResponse.json({ text })
  } catch (err) {
    if (err instanceof LinkedInProfilePdfError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[linkedin-extract] failed:', err)
    return NextResponse.json({ error: 'Could not read the PDF. Try pasting your profile text instead.' }, { status: 422 })
  }
}
