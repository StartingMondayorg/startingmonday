import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const formData = await request.formData().catch(() => null)
    if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: 'File too large (5 MB max)' }, { status: 413 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
    if (!isPdf)
      return NextResponse.json({ error: 'Only PDF files are supported. Download your LinkedIn profile as a PDF and try again.' }, { status: 415 })

    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    await parser.destroy()
    const text = result.text.replace(/\x00/g, '').trim()
    if (!text) return NextResponse.json({ error: 'No readable text found in this PDF. Try pasting your profile text instead.' }, { status: 422 })
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[linkedin-extract] failed:', err)
    return NextResponse.json({ error: 'Could not read the PDF. Try pasting your profile text instead.' }, { status: 422 })
  }
}
