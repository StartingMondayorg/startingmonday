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
    badge: 'bg-rose-100 text-rose-800 border border-rose-200',
    border: 'border-l-4 border-l-rose-500',
    surface: 'bg-rose-50/70 border-rose-200',
    text: 'text-rose-800',
    accent: 'text-rose-600',
  },
  'Needs intervention': {
    badge: 'bg-amber-100 text-amber-900 border border-amber-200',
    border: 'border-l-4 border-l-amber-500',
    surface: 'bg-amber-50/80 border-amber-200',
    text: 'text-amber-900',
    accent: 'text-amber-600',
  },
  Stable: {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    border: 'border-l-4 border-l-emerald-500',
    surface: 'bg-emerald-50/70 border-emerald-200',
    text: 'text-emerald-800',
    accent: 'text-emerald-600',
  },
}

const COMMITMENT_STATUS_TONES: Record<
  MockClient['thisWeekCommitments'][number]['status'],
  { badge: string; text: string; border: string }
> = {
  'On track': {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  'At risk': {
    badge: 'bg-amber-100 text-amber-900 border border-amber-200',
    text: 'text-amber-900',
    border: 'border-amber-200',
  },
  Overdue: {
    badge: 'bg-rose-100 text-rose-800 border border-rose-200',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
}

export function getClientStatusTone(status: MockClient['status']) {
  return CLIENT_STATUS_TONES[status]
}

export function getCommitmentStatusTone(status: MockClient['thisWeekCommitments'][number]['status']) {
  return COMMITMENT_STATUS_TONES[status]
}

export function getMomentumTone(momentum: number) {
  if (momentum < 45) return 'text-rose-700'
  if (momentum < 65) return 'text-amber-700'
  return 'text-emerald-700'
}

export function getOverdueTone(overdueActions: number) {
  if (overdueActions >= 4) return 'text-rose-700'
  if (overdueActions >= 2) return 'text-amber-700'
  return 'text-emerald-700'
}
