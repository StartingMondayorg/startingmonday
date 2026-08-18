import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { apiError } from '@/lib/api-error'
import { firstZodError, PMFEventTrackBodySchema } from '@/lib/schemas'
import { getPMFEventDefinition, type PMFEventName } from '@/lib/pmf-event-taxonomy'

const REQUIRED_CONTEXT_FIELDS = ['mode', 'confidence_band', 'action_context'] as const

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const rawBody = await request.json().catch(() => null)
  const parsedBody = PMFEventTrackBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return apiError(firstZodError(parsedBody.error), 400)
  }

  const { eventName, properties } = parsedBody.data
  const typedEventName = eventName as PMFEventName
  const definition = getPMFEventDefinition(typedEventName)

  const missingRequiredFields = definition.schema.required.filter((field) => {
    const value = properties[field]
    return value === undefined || value === null || value === ''
  })

  if (missingRequiredFields.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required PMF event fields',
        details: missingRequiredFields,
      },
      { status: 400 },
    )
  }

  const missingContextFields = REQUIRED_CONTEXT_FIELDS.filter((field) => {
    const value = properties[field]
    return value === undefined || value === null || value === ''
  })

  if (missingContextFields.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required PMF context fields',
        details: missingContextFields,
      },
      { status: 400 },
    )
  }

  await logEvent(auth.userId, typedEventName, properties)
  captureServerEvent(auth.userId, typedEventName, properties)

  return NextResponse.json({ ok: true })
}
