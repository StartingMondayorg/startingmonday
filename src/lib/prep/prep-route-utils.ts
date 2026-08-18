import type { InterviewStage } from '@/lib/prompts'

export function isAllowedJobUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    // Block RFC-1918, loopback, link-local, and common cloud metadata endpoints
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|0\.0\.0\.0)/.test(host)) return false
    return true
  } catch {
    return false
  }
}

export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeInterviewStage(value: string | null | undefined): InterviewStage | null {
  if (!value) return null
  const legacyToCurrent: Record<string, InterviewStage> = {
    recruiter_screen: 'informal_meeting',
    hiring_manager: 'first_interview',
    panel: 'board_presentation',
    final: 'final_round',
    executive: 'executive_interview',
  }

  if (value in legacyToCurrent) {
    return legacyToCurrent[value]
  }

  return value as InterviewStage
}
