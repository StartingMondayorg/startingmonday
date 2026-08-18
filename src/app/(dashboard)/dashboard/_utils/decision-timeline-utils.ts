type DecisionMarker = {
  marker: string
  decisionWindowLabel: string
}

export function decisionMarkerForStage(stage: string): DecisionMarker {
  switch (stage) {
    case 'watching':
      return {
        marker: 'Commit to keep or kill this target based on a concrete signal and role thesis fit.',
        decisionWindowLabel: 'within 2 days',
      }
    case 'researching':
      return {
        marker: 'Commit to outreach owner and first external contact path, or narrow out this target.',
        decisionWindowLabel: 'within 3 days',
      }
    case 'applied':
      return {
        marker: 'Commit to first follow-up move and sponsor path before this process goes cold.',
        decisionWindowLabel: 'within 3 days',
      }
    case 'interviewing':
      return {
        marker: 'Commit to explicit go/no-go criteria and top two risk responses before next round.',
        decisionWindowLabel: 'within 1 day',
      }
    case 'offer':
      return {
        marker: 'Commit to accept/decline decision path with non-negotiables and downside limits.',
        decisionWindowLabel: 'within 1 day',
      }
    default:
      return {
        marker: 'Commit to one irreversible next move or archive this campaign.',
        decisionWindowLabel: 'within 3 days',
      }
  }
}

const DECISION_OWNER_RE = /^\[Decision Owner:\s*([^\]]+)\]\s*$/im

export function extractDecisionOwnerFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null
  const match = notes.match(DECISION_OWNER_RE)
  if (!match) return null
  const owner = match[1]?.trim()
  return owner ? owner : null
}

export function upsertDecisionOwnerInNotes(notes: string | null | undefined, owner: string): string {
  const cleanedOwner = owner.trim() || 'Account owner'
  const ownerLine = `[Decision Owner: ${cleanedOwner}]`
  const base = (notes ?? '').trim()

  if (!base) return ownerLine

  if (DECISION_OWNER_RE.test(base)) {
    return base.replace(DECISION_OWNER_RE, ownerLine)
  }

  return `${ownerLine}\n${base}`
}
