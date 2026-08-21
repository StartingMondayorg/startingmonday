// Pure types, config, and scoring helpers extracted from SalesEnablementWorkspace for maintainability.
// No React/runtime deps. Scoring logic covered by sales-enablement-data.test.ts.
export type DeliveryModel = 'agency' | 'freelancer' | 'hybrid'
export type OptionStatus = 'active' | 'hold' | 'pass' | 'new'

export type VendorOption = {
  id: string
  name: string
  model: DeliveryModel
  monthlyCost: number
  status: OptionStatus
  owner: string
  strategicFit: number
  commercialRisk: number
  executionConfidence: number
  day14Target: string
  day30Target: string
  notes: string
}

export type WorkspaceState = {
  objective: string
  budgetCeiling: number
  primaryModel: 'done-for-you' | 'done-with-you' | 'hybrid'
  checkpointWindow: 'day-14' | 'day-30' | 'both'
  qualifiedMeetingDefinition: string
  options: VendorOption[]
  todayTopChoice: string
  backupChoice: string
  nextActions: string
}

export type SaveState = 'loading' | 'saving' | 'saved' | 'error' | 'read-only'
export const LOCAL_FALLBACK_KEY = 'sm-sales-enablement-workspace-v1'

export const WEIGHTS = {
  strategicFit: 0.4,
  commercialRisk: 0.35,
  executionConfidence: 0.25,
}

export const DEFAULT_STATE: WorkspaceState = {
  objective: 'More qualified meetings',
  budgetCeiling: 5000,
  primaryModel: 'done-for-you',
  checkpointWindow: 'both',
  qualifiedMeetingDefinition: 'Decision-maker or strong influencer, clear pain, timing <= 90 days, and explicit next step scheduled.',
  options: [
    {
      id: 'mauricio',
      name: 'Mauricio',
      model: 'freelancer',
      monthlyCost: 3500,
      status: 'active',
      owner: 'Richard',
      strategicFit: 5,
      commercialRisk: 4,
      executionConfidence: 5,
      day14Target: 'Launch complete + first qualified meetings booked',
      day30Target: '10+ qualified meetings held with show rate >= 80%',
      notes: 'Strong proof of execution and qualification rubric.',
    },
    {
      id: 'justin-power',
      name: 'Justin Power',
      model: 'freelancer',
      monthlyCost: 4500,
      status: 'active',
      owner: 'Richard',
      strategicFit: 4,
      commercialRisk: 3,
      executionConfidence: 4,
      day14Target: 'Dialing live + first qualified bookings',
      day30Target: 'Consistent qualified meetings with QA reporting',
      notes: 'Fast outbound orientation; verify quality and ownership model.',
    },
    {
      id: 'alessandra',
      name: 'Alessandra',
      model: 'freelancer',
      monthlyCost: 5000,
      status: 'hold',
      owner: 'Richard',
      strategicFit: 3,
      commercialRisk: 4,
      executionConfidence: 3,
      day14Target: 'Process and CRM framework ready',
      day30Target: 'Manager cadence and messaging framework fully operational',
      notes: 'Great enablement depth; less immediate meeting velocity.',
    },
    {
      id: 'revit',
      name: 'Revit',
      model: 'agency',
      monthlyCost: 3400,
      status: 'new',
      owner: 'Richard',
      strategicFit: 0,
      commercialRisk: 0,
      executionConfidence: 0,
      day14Target: 'Pending scope',
      day30Target: 'Pending proposal details',
      notes: 'Need scope, KPI, and qualification terms.',
    },
    {
      id: 'winning-by-design',
      name: 'Winning by Design',
      model: 'agency',
      monthlyCost: 0,
      status: 'new',
      owner: 'Richard',
      strategicFit: 0,
      commercialRisk: 0,
      executionConfidence: 0,
      day14Target: 'Pending first meeting',
      day30Target: 'Pending proposal details',
      notes: 'Initial response received; formal evaluation not started.',
    },
  ],
  todayTopChoice: 'Mauricio',
  backupChoice: 'Justin Power',
  nextActions: '1) Finalize qualified meeting definition. 2) Day-14 checkpoint terms in writing. 3) Lock day-30 success thresholds before kickoff.',
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(5, value))
}

export function weightedScore(option: VendorOption): number {
  const total =
    option.strategicFit * WEIGHTS.strategicFit +
    option.commercialRisk * WEIGHTS.commercialRisk +
    option.executionConfidence * WEIGHTS.executionConfidence
  return Math.round(total * 20)
}

export function scoreClass(score: number): string {
  if (score >= 80) return 'text-success bg-success/15 border-success/25'
  if (score >= 60) return 'text-warning bg-warning/15 border-warning/25'
  return 'text-muted-foreground bg-muted/60 border-border'
}
