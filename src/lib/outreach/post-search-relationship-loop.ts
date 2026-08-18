export type RelationshipAction = {
  id: 'reconnect' | 'value_share' | 'warm_intro'
  title: string
  cadence: 'weekly' | 'biweekly' | 'monthly'
  targetCount: number
}

type BuildLoopInput = {
  activeContacts: number
}

function boundedTarget(total: number, fraction: number, min: number): number {
  if (total <= 0) return 0
  return Math.max(min, Math.ceil(total * fraction))
}

export function buildRelationshipMaintenancePlan(input: BuildLoopInput): RelationshipAction[] {
  const total = Math.max(0, input.activeContacts)

  return [
    {
      id: 'reconnect',
      title: 'Personal reconnect check-ins',
      cadence: 'weekly',
      targetCount: boundedTarget(total, 0.12, 3),
    },
    {
      id: 'value_share',
      title: 'Signal or insight value-shares',
      cadence: 'biweekly',
      targetCount: boundedTarget(total, 0.08, 2),
    },
    {
      id: 'warm_intro',
      title: 'Warm introduction maintenance',
      cadence: 'monthly',
      targetCount: boundedTarget(total, 0.05, 1),
    },
  ]
}