/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'crypto'

type DispatchResultStatus = 'processing' | 'completed'

export type OnboardingVideoProviderDispatchInput = {
  runId: string
  userId: string
  provider: string
  inputPayload: Record<string, unknown>
}

export type OnboardingVideoProviderDispatchResult = {
  providerRunId: string
  status: DispatchResultStatus
  outputPayload: Record<string, unknown>
}

export class ProviderTerminalError extends Error {
  code: string

  constructor(message: string, code = 'provider_terminal') {
    super(message)
    this.name = 'ProviderTerminalError'
    this.code = code
  }
}

export function isProviderTerminalError(error: unknown): error is ProviderTerminalError {
  return error instanceof ProviderTerminalError
}

function getProviderMode(): 'mock' | 'live' {
  const mode = (process.env.ONBOARDING_VIDEO_PROVIDER_MODE ?? 'mock').toLowerCase()
  return mode === 'live' ? 'live' : 'mock'
}

async function dispatchHeygenLive(
  input: OnboardingVideoProviderDispatchInput,
): Promise<OnboardingVideoProviderDispatchResult> {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey) {
    throw new ProviderTerminalError('Missing HEYGEN_API_KEY', 'missing_provider_credentials')
  }

  const endpoint = process.env.HEYGEN_API_ENDPOINT ?? 'https://api.heygen.com/v2/video/generate'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'
  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/webhooks/onboarding-video`

  const body: Record<string, unknown> = {
    title: String(input.inputPayload.title ?? `onboarding-video-${input.runId}`),
    callback_url: webhookUrl,
    variables: input.inputPayload.variables ?? {},
    script: input.inputPayload.script ?? undefined,
    avatar_id: input.inputPayload.avatar_id ?? undefined,
    voice_id: input.inputPayload.voice_id ?? undefined,
    template_id: input.inputPayload.template_id ?? undefined,
    metadata: {
      run_id: input.runId,
      user_id: input.userId,
      tutorial_flow: input.inputPayload.tutorial_flow ?? null,
      event_name: input.inputPayload.event_name ?? null,
    },
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const raw = await response.text()
  let parsed: Record<string, any> = {}
  try {
    parsed = raw ? JSON.parse(raw) : {}
  } catch {
    parsed = { raw }
  }

  if (!response.ok) {
    const message = String(parsed?.message ?? parsed?.error ?? `Provider request failed (${response.status})`)
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      throw new ProviderTerminalError(message, 'provider_bad_request')
    }
    throw new Error(message)
  }

  const providerRunId = String(
    parsed?.data?.video_id
      ?? parsed?.data?.id
      ?? parsed?.video_id
      ?? parsed?.id
      ?? parsed?.run_id
      ?? '',
  ).trim()

  if (!providerRunId) {
    throw new Error('Provider response missing run identifier')
  }

  const normalizedStatus = String(parsed?.data?.status ?? parsed?.status ?? 'processing').toLowerCase()
  const status: DispatchResultStatus = normalizedStatus === 'completed' ? 'completed' : 'processing'

  return {
    providerRunId,
    status,
    outputPayload: {
      provider: input.provider,
      provider_status: normalizedStatus,
      provider_response: parsed,
      webhook_url: webhookUrl,
      dispatched_at: new Date().toISOString(),
    },
  }
}

function dispatchMock(input: OnboardingVideoProviderDispatchInput): OnboardingVideoProviderDispatchResult {
  const nowIso = new Date().toISOString()
  const providerRunId = `ovr_${randomUUID()}`
  return {
    providerRunId,
    status: 'completed',
    outputPayload: {
      provider: input.provider,
      provider_mode: 'mock',
      provider_run_id: providerRunId,
      video_url: `https://assets.startingmonday.app/onboarding-video/${input.runId}.mp4`,
      completed_at: nowIso,
    },
  }
}

export async function dispatchOnboardingVideoProvider(
  input: OnboardingVideoProviderDispatchInput,
): Promise<OnboardingVideoProviderDispatchResult> {
  const provider = input.provider.trim().toLowerCase()
  const mode = getProviderMode()

  if (mode === 'mock') {
    return dispatchMock(input)
  }

  if (provider === 'heygen') {
    return dispatchHeygenLive({ ...input, provider })
  }

  throw new ProviderTerminalError(`Unsupported onboarding video provider: ${provider}`, 'unsupported_provider')
}
