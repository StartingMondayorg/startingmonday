export function getNextScanDate(): string {
  const now = new Date()
  const scanDays = [1, 3, 5]
  for (let d = 0; d <= 7; d++) {
    const candidate = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d, 8, 0, 0, 0
    ))
    if (candidate > now && scanDays.includes(candidate.getUTCDay())) {
      return candidate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
      }) + ' at 8:00 AM UTC'
    }
  }
  return 'Mon, Wed, or Fri at 8:00 AM UTC'
}

export type RawHit = {
  title: string
  score: number
  is_match: boolean
  summary: string
  is_new: boolean
}

export type ScanResult = {
  id: string
  scanned_at: string
  status: string
  ai_score: number
  ai_summary: string | null
  raw_hits: RawHit[] | null
  error_message: string | null
}

export type InterviewLog = {
  id: string
  interview_date: string | null
  interview_stage: string | null
  questions_asked: string | null
  what_landed: string | null
  what_surprised: string | null
  follow_up_needed: string | null
}

export type SignalDetailRow = {
  id: string
  signal_type: string
  signal_summary: string
  outreach_angle: string | null
  outreach_draft: { subject: string; body: string } | null
  signal_date: string
  source_url: string | null
}

export const SIGNAL_LABELS: Record<string, { label: string; cls: string }> = {
  funding: { label: 'Funding', cls: 'bg-success/10 text-success' },
  exec_departure: { label: 'Exec Departure', cls: 'bg-warning/10 text-warning' },
  exec_hire: { label: 'Exec Hire', cls: 'bg-info/10 text-info' },
  acquisition: { label: 'Acquisition', cls: 'bg-info/10 text-info' },
  expansion: { label: 'Expansion', cls: 'bg-info/10 text-info' },
  layoffs: { label: 'Layoffs', cls: 'bg-destructive/10 text-destructive' },
  ipo: { label: 'IPO', cls: 'bg-success/10 text-success' },
  new_product: { label: 'New Product', cls: 'bg-info/10 text-info' },
  award: { label: 'Award', cls: 'bg-warning/10 text-warning' },
  pattern_alert: { label: 'Pattern', cls: 'bg-primary/10 text-primary' },
  filing_trend: { label: 'Filing Trend', cls: 'bg-success/10 text-success' },
}

export const DOC_LABELS: Record<string, { label: string; cls: string }> = {
  job_description: { label: 'Job Description', cls: 'bg-info/10 text-info' },
  news: { label: 'News & Press', cls: 'bg-info/10 text-info' },
  annual_report: { label: 'Annual Report', cls: 'bg-warning/10 text-warning' },
  org_notes: { label: 'Org Notes', cls: 'bg-success/10 text-success' },
  other: { label: 'Other', cls: 'bg-muted text-muted-foreground' },
}

export const CHANNEL: Record<string, { label: string; cls: string }> = {
  linkedin: { label: 'LinkedIn', cls: 'bg-info/10 text-info' },
  referral: { label: 'Referral', cls: 'bg-success/10 text-success' },
  cold: { label: 'Cold', cls: 'bg-muted text-muted-foreground' },
  inbound: { label: 'Inbound', cls: 'bg-info/10 text-info' },
  event: { label: 'Event', cls: 'bg-warning/10 text-warning' },
}

export const OUTREACH_STATUS: Record<string, { label: string; cls: string }> = {
  prospect: { label: 'Prospect', cls: 'bg-muted text-muted-foreground' },
  reached_out: { label: 'Reached Out', cls: 'bg-info/10 text-info' },
  in_conversation: { label: 'In Conversation', cls: 'bg-warning/10 text-warning' },
  meeting_scheduled: { label: 'Meeting Set', cls: 'bg-success/10 text-success' },
  closed: { label: 'Closed', cls: 'bg-muted text-muted-foreground' },
}

export const STAGES = [
  { value: 'watching', label: 'Watching' },
  { value: 'researching', label: 'Researching' },
  { value: 'applied', label: 'In Process' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
]

export const NOTES_PLACEHOLDERS: Record<string, string> = {
  cio: 'Transformation agenda, current CIO tenure and departure context, CFO relationship dynamic, board technology appetite...',
  cto: 'Engineering org size and maturity, current tech debt posture, what technical decision triggered this search, founding team dynamics...',
  cdo_data: 'Current data maturity, governance vs analytics mandate, what business decisions are made without data today, CDO departure context...',
  cdo_digital: 'Digital transformation agenda, current CIO or CMO dynamic, what customer experience problem is driving this search...',
  ciso: 'Recent regulatory events in their sector, board security posture, known incidents or audits, why the CISO role opened...',
  cpo: 'Current product health, engagement vs acquisition problem, what created this CPO opening, B2C or B2B context...',
  coo: 'What operational phase are they in? What can the CEO not do alone right now? What broke operationally in the last 12 months?',
  vp_technology: 'Engineering team size, reporting structure, what is blocking their technology capability, what the CTO or CIO needs help with...',
}

export const CSUITE_PATTERNS = ['cio', 'cto', 'coo', 'cpo', 'ciso', 'cdo', 'chief', 'evp']
