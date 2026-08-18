import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { buildPrepClaimProvenance, type PrepClaimProvenance } from '@/lib/prep-provenance'
import { scorePrepBriefConfidence } from '@/lib/prep-confidence'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, convertInchesToTwip,
} from 'docx'

type DownloadBody = {
  text?: unknown
  title?: unknown
  brief_id?: unknown
  low_confidence_acknowledged?: unknown
}

function toClaimList(value: unknown): PrepClaimProvenance[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is PrepClaimProvenance => {
    if (!item || typeof item !== 'object') return false
    const record = item as Record<string, unknown>
    return typeof record.claimText === 'string' && typeof record.originClass === 'string'
  })
}

function buildProvenanceAppendix(
  claims: PrepClaimProvenance[],
  confidenceBand: 'high' | 'medium' | 'low',
  generatedAtIso: string,
): Paragraph[] {
  const userProvided = claims.filter((c) => c.originClass === 'user_provided').length
  const systemDetected = claims.filter((c) => c.originClass === 'system_detected').length
  const inferred = claims.filter((c) => c.originClass === 'inferred').length

  return [
    new Paragraph({ text: '', spacing: { before: 180, after: 60 } }),
    new Paragraph({ text: 'Sources and Confidence Appendix', heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 80 } }),
    new Paragraph({ text: `Generated: ${new Date(generatedAtIso).toLocaleString('en-US')}`, spacing: { after: 60 } }),
    new Paragraph({ text: `Confidence band: ${confidenceBand}`, spacing: { after: 60 } }),
    new Paragraph({ text: `User provided claims: ${userProvided}`, spacing: { after: 60 } }),
    new Paragraph({ text: `System detected claims: ${systemDetected}`, spacing: { after: 60 } }),
    new Paragraph({ text: `Inferred claims: ${inferred}`, spacing: { after: 60 } }),
  ]
}

function parseLine(line: string): Paragraph {
  if (line.startsWith('## ')) {
    return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } })
  }
  if (line.startsWith('# ')) {
    return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 } })
  }
  if (line.startsWith('- ') || line.startsWith('* ')) {
    const content = line.slice(2)
    const runs = parseBold(content)
    return new Paragraph({ children: runs, bullet: { level: 0 }, spacing: { after: 60 } })
  }
  if (line.trim() === '') {
    return new Paragraph({ text: '', spacing: { after: 60 } })
  }
  // Regular paragraph with possible **bold** spans
  const runs = parseBold(line)
  return new Paragraph({ children: runs, spacing: { after: 80 } })
}

function parseBold(text: string): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true, size: 24, font: 'Calibri' })
    }
    return new TextRun({ text: part, size: 24, font: 'Calibri' })
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  let body: DownloadBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const text = (typeof body.text === 'string' ? body.text : '').trim()
  const title = (typeof body.title === 'string' ? body.title : 'Prep Brief').trim()
  const briefId = typeof body.brief_id === 'string' ? body.brief_id : null
  const lowConfidenceAcknowledged = body.low_confidence_acknowledged === true

  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const supabase = await createClient()
  let savedCreatedAt: string | null = null
  let savedClaims: PrepClaimProvenance[] = []

  if (briefId) {
    const { data: brief } = await supabase
      .from('briefs')
      .select('id, type, created_at, claim_provenance')
      .eq('id', briefId)
      .eq('user_id', auth.userId)
      .single()

    if (!brief) {
      return NextResponse.json({ error: 'Brief not found for export' }, { status: 404 })
    }

    savedCreatedAt = brief.created_at
    savedClaims = toClaimList(brief.claim_provenance)
  }

  const claims = savedClaims.length > 0 ? savedClaims : buildPrepClaimProvenance(text)
  const sensitiveClaims = claims.filter((claim) => (claim.sensitivePolicyHooks?.length ?? 0) > 0)
  if (sensitiveClaims.length > 0) {
    const sensitiveHookCounts = sensitiveClaims.reduce<Record<string, number>>((acc, claim) => {
      for (const hook of claim.sensitivePolicyHooks ?? []) {
        acc[hook] = (acc[hook] ?? 0) + 1
      }
      return acc
    }, {})

    return NextResponse.json(
      {
        error: 'Export blocked: sensitive claims require review before export.',
        sensitive_claim_count: sensitiveClaims.length,
        sensitive_hook_counts: sensitiveHookCounts,
        sample_claims: sensitiveClaims.slice(0, 3).map((claim) => claim.claimText),
      },
      { status: 412 },
    )
  }

  const confidence = scorePrepBriefConfidence(text)
  if (confidence.band === 'low' && !lowConfidenceAcknowledged) {
    return NextResponse.json(
      {
        error: 'Export blocked: low-confidence brief requires acknowledgment.',
        confidence_band: confidence.band,
        remediation: confidence.remediation,
      },
      { status: 412 },
    )
  }

  const lines = text.split('\n')
  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 32, font: 'Calibri' })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 },
    }),
    ...lines.map(parseLine),
    ...buildProvenanceAppendix(claims, confidence.band, savedCreatedAt ?? new Date().toISOString()),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1.25),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
          },
        },
      },
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const safeTitle = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
    },
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
