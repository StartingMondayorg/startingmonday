export type DashboardSearchPosture = 'active' | 'exploring' | 'not_looking'

export type DashboardSearchPostureInput = {
  searchPosture?: string | null
  employmentStatus?: string | null
  searchTimeline?: string | null
}

export function resolveDashboardSearchPosture(input: DashboardSearchPostureInput): DashboardSearchPosture {
  const explicit = input.searchPosture?.trim().toLowerCase()
  if (explicit === 'active' || explicit === 'exploring' || explicit === 'not_looking') {
    return explicit
  }

  const employmentStatus = input.employmentStatus?.trim().toLowerCase() ?? ''
  const searchTimeline = input.searchTimeline?.trim().toLowerCase() ?? ''

  if (employmentStatus === 'between_roles' || searchTimeline === 'immediately') {
    return 'active'
  }

  if (employmentStatus === 'employed_exploring' || searchTimeline === 'opportunistic') {
    return 'exploring'
  }

  return 'not_looking'
}
