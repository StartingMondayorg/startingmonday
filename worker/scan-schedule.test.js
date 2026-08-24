import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Jobs that open a browser through browserless.io. Two of these firing at the
// same minute would stack their concurrency budgets against a hard per-plan
// ceiling, which is what produced 148 of 152 rate-limit errors before the
// 2026-08-20 plan upgrade.
//
// Today they are separated only by how the cron strings happen to be written:
// scan-job runs days 1,3,5 and executive-scan-job runs days 0,2,4,6, so they
// never coincide. Nothing enforced that, and the advisory locks do not help --
// SCAN_LOCK_KEY and EXEC_SCAN_LOCK_KEY are different keys, so each job only
// excludes itself, never the other one.
const RENDER_JOBS = new Set(['scan-job', 'executive-scan-job', 'executive-evening-scan'])

const source = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

function cronEntries() {
  return [...source.matchAll(/cron\.schedule\('([^']+)'[^\n]*?runJob\('([^']+)'/g)]
    .map(([, expression, job]) => ({ expression, job }))
}

// Minimal cron field expansion: '*', '*/n', comma lists and 'a-b' ranges.
function expandField(field, min, max) {
  const values = new Set()
  for (const part of field.split(',')) {
    if (part === '*') {
      for (let v = min; v <= max; v++) values.add(v)
    } else if (/^\*\/\d+$/.test(part)) {
      const step = Number(part.slice(2))
      for (let v = min; v <= max; v += step) values.add(v)
    } else if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split('-').map(Number)
      for (let v = a; v <= b; v++) values.add(v)
    } else {
      values.add(Number(part))
    }
  }
  return values
}

// Every (dayOfWeek, hour, minute) a cron expression fires in a week.
function firingSlots(expression) {
  const [minute, hour, dayOfMonth, , dayOfWeek] = expression.split(' ')
  if (dayOfMonth !== '*') return []  // monthly jobs are out of scope
  const slots = []
  for (const d of expandField(dayOfWeek, 0, 6)) {
    for (const h of expandField(hour, 0, 23)) {
      for (const m of expandField(minute, 0, 59)) slots.push(`${d} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

describe('browserless.io render scheduling', () => {
  it('never fires two render jobs in the same minute', () => {
    const bySlot = new Map()

    for (const { expression, job } of cronEntries()) {
      if (!RENDER_JOBS.has(job)) continue
      for (const slot of firingSlots(expression)) {
        if (!bySlot.has(slot)) bySlot.set(slot, new Set())
        bySlot.get(slot).add(job)
      }
    }

    const collisions = [...bySlot.entries()]
      .filter(([, jobs]) => jobs.size > 1)
      .map(([slot, jobs]) => `${slot} -> ${[...jobs].sort().join(' + ')}`)

    expect(collisions).toEqual([])
  })

  it('schedules every render job it claims to cover', () => {
    const scheduled = new Set(cronEntries().map(({ job }) => job))
    for (const job of RENDER_JOBS) {
      expect(scheduled, `${job} is in RENDER_JOBS but has no cron entry`).toContain(job)
    }
  })

  // Guards the assumption the first test rests on: if someone widens either
  // day set, the two 08:00 jobs start colliding and the test above catches it
  // only because these really are the day fields in play.
  it('keeps the two 08:00 jobs on disjoint days', () => {
    const entries = cronEntries()
    const standard = entries.find(e => e.job === 'scan-job')
    const executive = entries.find(e => e.job === 'executive-scan-job')

    const standardDays = new Set(firingSlots(standard.expression).map(s => s.split(' ')[0]))
    const executiveDays = new Set(firingSlots(executive.expression).map(s => s.split(' ')[0]))
    const shared = [...standardDays].filter(d => executiveDays.has(d))

    expect(shared).toEqual([])
    expect(standardDays.size + executiveDays.size).toBe(7)
  })
})
