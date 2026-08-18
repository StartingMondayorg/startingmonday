'use client'

import { useMemo, useState } from 'react'

type Channel = 'executives' | 'coaches' | 'outplacement' | 'search_firms'
type Role = 'program_lead' | 'counselor_lead' | 'procurement' | 'sponsor'

type Baseline = {
  avgSalary: number
  cycleWeeks: number
  participants: number
  counselorSessionsPerMonth: number
}

const CHANNEL_BASELINE: Record<Channel, Baseline> = {
  executives: { avgSalary: 320000, cycleWeeks: 24, participants: 40, counselorSessionsPerMonth: 5 },
  coaches: { avgSalary: 230000, cycleWeeks: 20, participants: 30, counselorSessionsPerMonth: 6 },
  outplacement: { avgSalary: 270000, cycleWeeks: 22, participants: 50, counselorSessionsPerMonth: 6 },
  search_firms: { avgSalary: 290000, cycleWeeks: 18, participants: 35, counselorSessionsPerMonth: 4 },
}

const ROLE_MIX: Record<Role, { accelerationPct: number; counselorTimeSavingsPct: number; missRiskReductionPct: number }> = {
  program_lead: { accelerationPct: 12, counselorTimeSavingsPct: 22, missRiskReductionPct: 18 },
  counselor_lead: { accelerationPct: 10, counselorTimeSavingsPct: 28, missRiskReductionPct: 16 },
  procurement: { accelerationPct: 8, counselorTimeSavingsPct: 18, missRiskReductionPct: 14 },
  sponsor: { accelerationPct: 14, counselorTimeSavingsPct: 24, missRiskReductionPct: 20 },
}

const CHANNEL_LABELS: Record<Channel, string> = {
  executives: 'Executives',
  coaches: 'Coaches',
  outplacement: 'Outplacement',
  search_firms: 'Search Firms',
}

const ROLE_LABELS: Record<Role, string> = {
  program_lead: 'Program Lead',
  counselor_lead: 'Counselor Lead',
  procurement: 'Procurement',
  sponsor: 'Executive Sponsor',
}

function usd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`
}

export function RoiCalculatorClient() {
  const [channel, setChannel] = useState<Channel>('outplacement')
  const [role, setRole] = useState<Role>('program_lead')
  const [participants, setParticipants] = useState(CHANNEL_BASELINE.outplacement.participants)
  const [avgSalary, setAvgSalary] = useState(CHANNEL_BASELINE.outplacement.avgSalary)

  const model = useMemo(() => {
    const baseline = CHANNEL_BASELINE[channel]
    const roleMix = ROLE_MIX[role]

    const cycleWeeks = baseline.cycleWeeks
    const acceleratedWeeks = cycleWeeks * (roleMix.accelerationPct / 100)
    const annualizedSalaryThroughput = participants * avgSalary
    const speedValue = annualizedSalaryThroughput * (acceleratedWeeks / 52) * 0.22

    const monthlyCounselorHours = participants * baseline.counselorSessionsPerMonth
    const savedCounselorHours = monthlyCounselorHours * (roleMix.counselorTimeSavingsPct / 100)
    const counselorValue = savedCounselorHours * 180

    const missRiskValue = annualizedSalaryThroughput * (roleMix.missRiskReductionPct / 100) * 0.04
    const annualRoiValue = speedValue + (counselorValue * 12) + missRiskValue

    return {
      cycleWeeks,
      acceleratedWeeks,
      speedValue,
      counselorValue,
      missRiskValue,
      annualRoiValue,
      counselorTimeSavingsPct: roleMix.counselorTimeSavingsPct,
      accelerationPct: roleMix.accelerationPct,
      missRiskReductionPct: roleMix.missRiskReductionPct,
    }
  }, [channel, role, participants, avgSalary])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-4">Assumptions</p>

        <label htmlFor="roi-channel" className="block text-[12px] font-semibold text-slate-700 mb-1">Channel</label>
        <select
          id="roi-channel"
          title="Channel"
          value={channel}
          onChange={(event) => {
            const next = event.target.value as Channel
            setChannel(next)
            setParticipants(CHANNEL_BASELINE[next].participants)
            setAvgSalary(CHANNEL_BASELINE[next].avgSalary)
          }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] mb-4"
        >
          {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label htmlFor="roi-role" className="block text-[12px] font-semibold text-slate-700 mb-1">Buyer role</label>
        <select
          id="roi-role"
          title="Buyer role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] mb-4"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label htmlFor="roi-participants" className="block text-[12px] font-semibold text-slate-700 mb-1">Participants in cohort</label>
        <input
          id="roi-participants"
          title="Participants in cohort"
          placeholder="Enter participants in cohort"
          type="number"
          min={1}
          value={participants}
          onChange={(event) => setParticipants(Math.max(1, Number(event.target.value || 1)))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] mb-4"
        />

        <label htmlFor="roi-avg-salary" className="block text-[12px] font-semibold text-slate-700 mb-1">Average target salary</label>
        <input
          id="roi-avg-salary"
          title="Average target salary"
          placeholder="Enter average target salary"
          type="number"
          min={50000}
          step={5000}
          value={avgSalary}
          onChange={(event) => setAvgSalary(Math.max(50000, Number(event.target.value || 50000)))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Modeled outputs</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard label="Cycle acceleration" value={pct(model.accelerationPct)} note={`${model.acceleratedWeeks.toFixed(1)} weeks recovered`} />
          <MetricCard label="Counselor time saved" value={pct(model.counselorTimeSavingsPct)} note="Session prep + context rebuild" />
          <MetricCard label="Miss-risk reduction" value={pct(model.missRiskReductionPct)} note="Pipeline timing + intervention" />
          <MetricCard label="Annual ROI value" value={usd(model.annualRoiValue)} note="Modeled directional estimate" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ValuePanel title="Placement speed value" value={usd(model.speedValue)} detail={`Based on ${model.cycleWeeks}-week baseline cycle`} />
          <ValuePanel title="Counselor efficiency value" value={usd(model.counselorValue * 12)} detail="Annualized session-yield recovery" />
          <ValuePanel title="Outcome-risk avoidance" value={usd(model.missRiskValue)} detail="Modeled reduction in missed opportunities" />
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="text-[20px] font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1">{note}</p>
    </div>
  )
}

function ValuePanel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <p className="text-[12px] font-semibold text-slate-800">{title}</p>
      <p className="text-[22px] font-bold text-orange-600 mt-2">{value}</p>
      <p className="text-[11px] text-slate-500 mt-2">{detail}</p>
    </div>
  )
}
