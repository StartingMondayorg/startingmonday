import { type WeekActivity } from '@/components/ActivityChart'

export function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

export function weekLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function bumpWeek(
  buckets: Map<string, WeekActivity>,
  dateStr: string,
  key: keyof Omit<WeekActivity, 'week'>,
) {
  const monday = getWeekMonday(new Date(dateStr))
  const label = weekLabel(monday)
  if (!buckets.has(label)) {
    buckets.set(label, { week: label, companies: 0, contacts: 0, briefs: 0, followUps: 0 })
  }
  const row = buckets.get(label)
  if (!row) return
  row[key] += 1
}
