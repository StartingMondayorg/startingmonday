import type { MockClient } from './mock-data'

type Tone = {
  badge: string
  border: string
  surface: string
  text: string
  accent: string
}

const CLIENT_STATUS_TONES: Record<MockClient['status'], Tone> = {
  'High risk': {
    badge: 'bg-destructive/10 text-destructive border border-destructive/30',
    border: 'border-l-4 border-l-destructive/30',
    surface: 'bg-destructive/70 border-destructive/30',
    text: 'text-destructive',
    accent: 'text-destructive',
  },
  'Needs intervention': {
    badge: 'bg-warning/10 text-warning border border-warning/30',
    border: 'border-l-4 border-l-warning/30',
    surface: 'bg-warning/80 border-warning/30',
    text: 'text-warning',
    accent: 'text-warning',
  },
  Stable: {
    badge: 'bg-success/10 text-success border border-success/30',
    border: 'border-l-4 border-l-success/30',
    surface: 'bg-success/70 border-success/30',
    text: 'text-success',
    accent: 'text-success',
  },
}

const COMMITMENT_STATUS_TONES: Record<
  MockClient['thisWeekCommitments'][number]['status'],
  { badge: string; text: string; border: string }
> = {
  'On track': {
    badge: 'bg-success/10 text-success border border-success/30',
    text: 'text-success',
    border: 'border-success/30',
  },
  'At risk': {
    badge: 'bg-warning/10 text-warning border border-warning/30',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  Overdue: {
    badge: 'bg-destructive/10 text-destructive border border-destructive/30',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
}

export function getClientStatusTone(status: MockClient['status']) {
  return CLIENT_STATUS_TONES[status]
}

export function getCommitmentStatusTone(status: MockClient['thisWeekCommitments'][number]['status']) {
  return COMMITMENT_STATUS_TONES[status]
}

export function getMomentumTone(momentum: number) {
  if (momentum < 45) return 'text-destructive'
  if (momentum < 65) return 'text-warning'
  return 'text-success'
}

export function getOverdueTone(overdueActions: number) {
  if (overdueActions >= 4) return 'text-destructive'
  if (overdueActions >= 2) return 'text-warning'
  return 'text-success'
}
