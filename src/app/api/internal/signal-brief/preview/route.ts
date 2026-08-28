import { NextRequest, NextResponse } from 'next/server'
import { validateInternalRouteRequest } from '@/lib/internal-route-auth'
import { isSignalBriefPreviewEnabled } from '@/lib/feature-flags'
import { adaptSignalBriefPayload, type RawSignalBriefPayload } from '@/lib/signal-brief-adapter'
import { renderSignalBrief } from '@/lib/signal-brief-renderer'

const MAX_BODY_BYTES = 256_000

function jsonResponse(body: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateInternalRouteRequest(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 403)
  }

  if (!isSignalBriefPreviewEnabled()) {
    return jsonResponse({ error: 'Signal brief preview is disabled' }, 503)
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Signal brief payload is too large' }, 413)
  }

  let payload: RawSignalBriefPayload
  try {
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Signal brief payload is too large' }, 413)
    }
    payload = JSON.parse(rawBody) as RawSignalBriefPayload
  } catch {
    return jsonResponse({ error: 'Signal brief payload must be valid JSON' }, 400)
  }

  try {
    const input = adaptSignalBriefPayload(payload)
    return jsonResponse({ html: renderSignalBrief(input) }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid signal brief payload' }, 422)
  }
}
