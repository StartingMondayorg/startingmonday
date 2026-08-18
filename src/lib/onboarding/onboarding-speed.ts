export type OnboardingChannel = 'executives' | 'coaches' | 'outplacement' | 'search_firms'

export type SearchPersona = 'csuite' | 'vp' | 'director' | 'board'

export type OnboardingChecklistItem = {
  id: string
  label: string
  done: boolean
}

export function normalizeOnboardingChannel(value: string | null | undefined): OnboardingChannel {
  if (value === 'coaches' || value === 'outplacement' || value === 'search_firms') return value
  return 'executives'
}

export function isTransitionFirstCohort(employmentStatus: string | null, searchTimeline: string | null): boolean {
  return employmentStatus === 'between_roles' || searchTimeline === 'immediately'
}

export function computeElapsedSeconds(startedAtIso: string | null | undefined, endedAtIso?: string): number {
  if (!startedAtIso) return 0
  const startMs = new Date(startedAtIso).getTime()
  if (!Number.isFinite(startMs)) return 0
  const endMs = endedAtIso ? new Date(endedAtIso).getTime() : Date.now()
  if (!Number.isFinite(endMs)) return 0
  return Math.max(0, Math.round((endMs - startMs) / 1000))
}

export function isUnderTenMinutes(elapsedSeconds: number): boolean {
  return elapsedSeconds > 0 && elapsedSeconds <= 600
}

export function onboardingMilestones(args: {
  searchPersona: string | null
  hasSituation: boolean
  hasImportedProfile: boolean
  companyCount: number
  doneStepReached: boolean
  lowEnergyMode: boolean
}): OnboardingChecklistItem[] {
  const base: OnboardingChecklistItem[] = [
    {
      id: 'persona',
      label: 'Select persona focus',
      done: !!args.searchPersona,
    },
    {
      id: 'situation',
      label: 'Set transition context',
      done: args.hasSituation || args.lowEnergyMode,
    },
    {
      id: 'profile',
      label: 'Import or confirm profile basics',
      done: args.hasImportedProfile || args.lowEnergyMode,
    },
    {
      id: 'watchlist',
      label: 'Launch first watchlist',
      done: args.companyCount > 0,
    },
    {
      id: 'first_value',
      label: 'Reach first value preview',
      done: args.doneStepReached,
    },
  ]

  return base
}

export function channelChecklistTitle(channel: OnboardingChannel): string {
  if (channel === 'coaches') return 'Coach setup checklist'
  if (channel === 'outplacement') return 'Outplacement setup checklist'
  if (channel === 'search_firms') return 'Search-firm setup checklist'
  return 'Executive setup checklist'
}

export function estimateManualFieldReduction(args: {
  fullName: string
  currentTitle: string
  currentCompany: string
  searchPersona: string
  companyCount: number
  importedProfile: boolean
  lowEnergyMode: boolean
}): {
  baselineManualFields: number
  requiredManualFields: number
  reductionRate: number
} {
  const baselineManualFields = 5
  let requiredManualFields = 0

  if (!args.fullName.trim()) requiredManualFields += 1
  if (!args.searchPersona.trim()) requiredManualFields += 1
  if (!args.currentTitle.trim()) requiredManualFields += 1
  if (!args.currentCompany.trim()) requiredManualFields += 1
  if (args.companyCount <= 0) requiredManualFields += 1

  if (args.importedProfile && requiredManualFields > 0) {
    requiredManualFields = Math.max(0, requiredManualFields - 2)
  }
  if (args.lowEnergyMode && requiredManualFields > 0) {
    requiredManualFields = Math.max(0, requiredManualFields - 1)
  }

  const reductionRate = Number((((baselineManualFields - requiredManualFields) / baselineManualFields) * 100).toFixed(2))

  return {
    baselineManualFields,
    requiredManualFields,
    reductionRate,
  }
}

export function formatDurationShort(elapsedSeconds: number): string {
  const min = Math.floor(elapsedSeconds / 60)
  const sec = elapsedSeconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}
