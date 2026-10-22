// Pure parsing for the interview prep worksheet, kept separate from the server
// action so it can be unit-tested without a Supabase client.

export const INTERVIEW_PREP_ANSWER_KEYS = [
  'positioning',
  'why_now',
  'company_context',
  'role_fit',
  'objection',
  'objection_response',
] as const

export type InterviewPrepAnswerKey = (typeof INTERVIEW_PREP_ANSWER_KEYS)[number]
export type InterviewPrepAnswers = Partial<Record<InterviewPrepAnswerKey, string>>
export type InterviewPrepStatus = 'draft' | 'saved'

export type InterviewPrepRow = {
  id: string
  company_name: string | null
  role_title: string | null
  interview_at: string | null
  answers: InterviewPrepAnswers | null
  status: InterviewPrepStatus
  updated_at: string
}

export type InterviewPrepInput = {
  id: string | null
  companyName: string | null
  roleTitle: string | null
  interviewAt: string | null
  answers: InterviewPrepAnswers
  status: InterviewPrepStatus
}

const MAX_SHORT = 200
const MAX_ANSWER = 4000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function text(formData: FormData, key: string, max: number): string | null {
  const raw = formData.get(key)
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().slice(0, max)
  return trimmed || null
}

// A datetime-local value carries no zone. Treat it as UTC-naive on the way in
// and render it back with UTC getters, so it round-trips regardless of the
// server's own timezone. Anything that does not parse is dropped.
function dateTime(formData: FormData, key: string): string | null {
  const raw = text(formData, key, 40)
  if (!raw) return null
  const naive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw) ? `${raw}Z` : raw
  const parsed = new Date(naive)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function parseInterviewPrepForm(formData: FormData): InterviewPrepInput {
  const rawId = text(formData, 'id', 40)
  const answers: InterviewPrepAnswers = {}
  for (const key of INTERVIEW_PREP_ANSWER_KEYS) {
    const value = text(formData, key, MAX_ANSWER)
    if (value) answers[key] = value
  }
  return {
    id: rawId && UUID_RE.test(rawId) ? rawId : null,
    companyName: text(formData, 'company_name', MAX_SHORT),
    roleTitle: text(formData, 'role_title', MAX_SHORT),
    interviewAt: dateTime(formData, 'interview_at'),
    answers,
    status: formData.get('status') === 'saved' ? 'saved' : 'draft',
  }
}

export function isInterviewPrepEmpty(input: InterviewPrepInput): boolean {
  return !input.companyName && !input.roleTitle && !input.interviewAt && Object.keys(input.answers).length === 0
}

// datetime-local wants "YYYY-MM-DDTHH:MM" in local time; we render what was stored
// as UTC-naive so the user sees the time they typed.
export function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
