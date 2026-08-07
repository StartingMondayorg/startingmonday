import signalSourceCatalog from '../../config/signal-source-catalog.json'
import { scorePharmaSignal, type PharmaSignalInput } from '@/lib/pharma-signal-scoring'

export type SignalSourceStatus = 'active' | 'pilot' | 'planned' | 'deprecated'
export type SignalSourceRoleFamily = 'leadership' | 'technical_leadership' | 'delivery_leadership'

export type SignalSource = {
  key: string
  name: string
  category: string
  accessMethod: string
  rightsStatus: string
  status: SignalSourceStatus
  implemented: boolean
  freshnessSloHours: number
  lastReviewedAt: string
  roleFamilies: SignalSourceRoleFamily[]
}

export type SignalSourceCatalog = {
  version: number
  updatedAt: string
  reviewCadenceDays: number
  sources: SignalSource[]
}

export function getSignalSourceCatalog(): SignalSourceCatalog {
  return signalSourceCatalog as SignalSourceCatalog
}

export function getActiveSourcesByRoleFamily(roleFamily: SignalSourceRoleFamily): SignalSource[] {
  const catalog = getSignalSourceCatalog()
  return catalog.sources.filter(
    (source) =>
      source.status !== 'deprecated' &&
      source.status !== 'planned' &&
      source.roleFamilies.includes(roleFamily)
  )
}

export function getCatalogGovernanceSummary(now = new Date()): {
  sourceCount: number
  activeCount: number
  pilotCount: number
  plannedCount: number
  deprecatedCount: number
  dueForReview: SignalSource[]
} {
  const catalog = getSignalSourceCatalog()
  const cadenceMs = catalog.reviewCadenceDays * 24 * 60 * 60 * 1000
  const nowMs = now.getTime()

  const dueForReview = catalog.sources.filter((source) => {
    const reviewedAt = new Date(`${source.lastReviewedAt}T00:00:00Z`).getTime()
    if (Number.isNaN(reviewedAt)) return true
    return nowMs - reviewedAt >= cadenceMs
  })

  return {
    sourceCount: catalog.sources.length,
    activeCount: catalog.sources.filter((source) => source.status === 'active').length,
    pilotCount: catalog.sources.filter((source) => source.status === 'pilot').length,
    plannedCount: catalog.sources.filter((source) => source.status === 'planned').length,
    deprecatedCount: catalog.sources.filter((source) => source.status === 'deprecated').length,
    dueForReview,
  }
}

export function scoreSignalForPharmaPilot(input: PharmaSignalInput) {
  return scorePharmaSignal(input)
}
