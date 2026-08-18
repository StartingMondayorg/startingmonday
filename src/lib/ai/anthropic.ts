import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const MODELS = {
  opus:   process.env.ANTHROPIC_OPUS_MODEL   ?? 'claude-opus-4-7',
  sonnet: process.env.ANTHROPIC_CHAT_MODEL   ?? 'claude-sonnet-4-6',
  haiku:  process.env.ANTHROPIC_HAIKU_MODEL  ?? 'claude-haiku-4-5-20251001',
} as const

// Temperature presets - calibrated to content type
export const TEMP = {
  structured: 0.2,  // strategy brief, resume tailor - precision over variety
  analytical: 0.3,  // prep, followup, Q&A - analytical but specifics vary
  factual:    0.4,  // briefing, suggestions - factual with natural variation
  balanced:   0.5,  // chat - conversational, some unpredictability is fine
  creative:   0.7,  // outreach drafts - creative writing benefits from variety
  extract:    0.1,  // classification, extraction - needs deterministic output
} as const

// Executive tier gets Opus; all others get Sonnet.
export function getModelForTier(tier: string): string {
  const opusEnabled = process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED !== '0'
  const shouldUseOpus = tier === 'executive' || tier === 'campaign'
  return shouldUseOpus && opusEnabled ? MODELS.opus : MODELS.sonnet
}

// Wraps a streaming promise with an AbortController timeout.
// If the stream doesn't resolve within ms, the abort signal fires and
// the Anthropic SDK cancels the in-flight request.
export function withStreamTimeout<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fn(controller.signal).finally(() => clearTimeout(timer))
}
