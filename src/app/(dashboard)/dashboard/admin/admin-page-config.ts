export const STEP_LABELS: Record<string, string> = {
  a1_resume: 'Resume uploaded',
  a2_company: 'Company added',
  a3_prep: 'Prep brief generated',
  a4_contact: 'Contact added',
  a5_briefing: 'Briefing configured',
  a6_follow_up: 'Follow-up set',
}

export type InternalPage = {
  path: string
  label: string
  owner: string
  admin: string
  viewer: string
  priority: 'core' | 'advanced'
}

export type PageGroup = {
  id: string
  label: string
  purpose: string
  pages: InternalPage[]
}

export const PAGE_GROUPS: PageGroup[] = [
  {
    id: 'revenue-growth',
    label: 'Revenue & Growth',
    purpose: 'Pipeline, customer conversion, demand generation, and GTM execution.',
    pages: [
      { path: '/dashboard/admin/revenue', label: 'Revenue Hub', owner: 'rw', admin: 'rw', viewer: 'r', priority: 'core' },
      { path: '/dashboard/admin/crm', label: 'CRM', owner: 'rw', admin: 'rw', viewer: '-', priority: 'core' },
      { path: '/dashboard/admin/customers', label: 'Customers', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/outreach-analytics', label: 'Outreach Performance', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/outreach-reliability', label: 'Outreach Reliability', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/coach-outreach', label: 'Coach Outreach', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/outplacement-outreach', label: 'Outplacement Outreach', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/social', label: 'LinkedIn Social', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/linkedin-company-launch', label: 'LinkedIn Company Launch', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/speakers', label: 'Conference Speakers', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
    ],
  },
  {
    id: 'product-intelligence',
    label: 'Product & Intelligence',
    purpose: 'Customer intelligence, quality signals, and product performance telemetry.',
    pages: [
      { path: '/dashboard/admin/product', label: 'Product Hub', owner: 'rw', admin: 'rw', viewer: 'r', priority: 'core' },
      { path: '/dashboard/admin/intelligence', label: 'Intelligence (B2B)', owner: 'rw', admin: 'rw', viewer: '-', priority: 'core' },
      { path: '/dashboard/admin/b2b', label: 'B2B Deals', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/metrics', label: 'Action Scores', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/channel-benchmarks', label: 'Channel Benchmarks', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/wedge-funnels', label: 'Wedge Funnel Monitor', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/feedback', label: 'Feedback Queue', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/traces', label: 'LLM Traces / Evals', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/prep-efficacy', label: 'Prep Efficacy', owner: 'rw', admin: 'rw', viewer: '-', priority: 'advanced' },
    ],
  },
  {
    id: 'platform-operations',
    label: 'Platform Operations',
    purpose: 'Runbooks, access control, reliability, and operational governance.',
    pages: [
      { path: '/dashboard/admin/operations', label: 'Operations Hub', owner: 'rw', admin: 'rw', viewer: 'r', priority: 'core' },
      { path: '/dashboard/admin/operations/wedge-cron', label: 'Wedge Cron History', owner: 'rw', admin: 'rw', viewer: 'r', priority: 'advanced' },
      { path: '/dashboard/admin/operations/wedge-economics', label: 'Wedge Economics Ledgers', owner: 'rw', admin: 'rw', viewer: 'r', priority: 'advanced' },
      { path: '/guide', label: 'Automation Guide', owner: 'rw', admin: 'rw', viewer: '-', priority: 'core' },
      { path: '/dashboard/admin/team', label: 'Team Management', owner: 'rw', admin: 'r', viewer: '-', priority: 'advanced' },
      { path: '/dashboard/admin/outreach', label: 'Outreach Hub', owner: 'rw', admin: 'rw', viewer: 'r', priority: 'advanced' },
    ],
  },
]

export const INTERNAL_APIS = [
  { path: '/api/outreach/draft', label: 'Outreach Draft', owner: 'rw', admin: 'rw', viewer: '-' },
  { path: '/api/outreach/send', label: 'Outreach Send', owner: 'rw', admin: 'rw', viewer: '-' },
  { path: '/api/outreach/status', label: 'Outreach Status', owner: 'rw', admin: 'rw', viewer: '-' },
  { path: '/api/outreach/suppression', label: 'Outreach Suppression', owner: 'rw', admin: 'rw', viewer: '-' },
  { path: '/api/admin/outreach/reliability', label: 'Outreach Reliability', owner: 'rw', admin: 'rw', viewer: '-' },
  { path: '/api/admin/automation/monitoring/alerts', label: 'Automation Alerts', owner: 'rw', admin: 'rw', viewer: '-' },
]