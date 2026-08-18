'use client'

import type React from 'react'

/**
 * ExecutiveDecisionCockpit.tsx
 *
 * Sprint ITS-3 - Ticket 18: Decision cockpit with risk and constraints scoring.
 *
 * AC:
 * - Decision owner, confidence, blockers, next irreversible choice
 * - Hard constraint gates (disqualify before weighted scoring)
 * - Weighted what-matters fit score and risk score
 * - Explicit tradeoff notes
 * - Pre/post interview thoughts with perceived-fit and confidence deltas
 * - Target rankings overall and by criterion
 * - User-defined custom factors supported
 */

import { useState, useMemo } from 'react'
import type { WhatMattersCriterion, TargetEvaluation } from '@/lib/what-matters-scoring'
import { DEFAULT_CRITERIA, scoreTarget, rankTargets } from '@/lib/what-matters-scoring'

interface ExecutiveDecisionCockpitProps {
  initialCriteria?: WhatMattersCriterion[]
  initialEvaluations?: TargetEvaluation[]
  onSave?: (criteria: WhatMattersCriterion[], evaluations: TargetEvaluation[]) => void
}

// Tailwind width classes for score bars - static list so Tailwind scanner can detect them
const SCORE_BAR_WIDTHS: Record<number, string> = {
  0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]',
  25: 'w-1/4', 30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-2/5', 45: 'w-[45%]',
  50: 'w-1/2', 55: 'w-[55%]', 60: 'w-3/5', 65: 'w-[65%]', 70: 'w-[70%]',
  75: 'w-3/4', 80: 'w-4/5', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]', 100: 'w-full',
}

function ScoreBar({ score, max = 100, color = 'bg-orange-500' }: { score: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((score / max) / 5) * 5) // snap to 5% increments
  const widthClass = SCORE_BAR_WIDTHS[pct] ?? 'w-0'
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color} ${widthClass} transition-all`} aria-hidden="true" />
    </div>
  )
}

export function ExecutiveDecisionCockpit({
  initialCriteria = DEFAULT_CRITERIA,
  initialEvaluations = [],
  onSave,
}: ExecutiveDecisionCockpitProps) {
  const [criteria, setCriteria] = useState<WhatMattersCriterion[]>(initialCriteria)
  const [evaluations, setEvaluations] = useState<TargetEvaluation[]>(initialEvaluations)
  const [activeTargetId, setActiveTargetId] = useState<string | null>(
    initialEvaluations[0]?.targetId ?? null,
  )
  const [newTargetName, setNewTargetName] = useState('')
  const [newCriterionLabel, setNewCriterionLabel] = useState('')
  const [view, setView] = useState<'rankings' | 'criteria' | 'detail'>('rankings')

  const rankings = useMemo(() => rankTargets(evaluations, criteria), [evaluations, criteria])

  function addTarget() {
    if (!newTargetName.trim()) return
    const id = `target-${Date.now()}`
    setEvaluations((prev) => [
      ...prev,
      {
        targetId: id,
        targetName: newTargetName.trim(),
        criterionScores: criteria.map((c) => ({ criterionId: c.id, score: 5 })),
        hardConstraintFails: [],
      },
    ])
    setActiveTargetId(id)
    setNewTargetName('')
  }

  function addCustomCriterion() {
    if (!newCriterionLabel.trim()) return
    const id = `custom-${Date.now()}`
    setCriteria((prev) => [
      ...prev,
      { id, label: newCriterionLabel.trim(), weight: 7, isHardConstraint: false, isCustom: true },
    ])
    // Add score entry for all existing evaluations
    setEvaluations((prev) =>
      prev.map((e) => ({
        ...e,
        criterionScores: [...e.criterionScores, { criterionId: id, score: 5 }],
      })),
    )
    setNewCriterionLabel('')
  }

  function updateScore(targetId: string, criterionId: string, score: number) {
    setEvaluations((prev) =>
      prev.map((e) =>
        e.targetId !== targetId
          ? e
          : {
              ...e,
              criterionScores: e.criterionScores.map((s) =>
                s.criterionId === criterionId ? { ...s, score } : s,
              ),
            },
      ),
    )
  }

  function updateEvalField<K extends keyof TargetEvaluation>(
    targetId: string,
    field: K,
    value: TargetEvaluation[K],
  ) {
    setEvaluations((prev) =>
      prev.map((e) => (e.targetId === targetId ? { ...e, [field]: value } : e)),
    )
  }

  function toggleHardConstraint(criterionId: string) {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId ? { ...c, isHardConstraint: !c.isHardConstraint } : c,
      ),
    )
  }

  function updateWeight(criterionId: string, weight: number) {
    setCriteria((prev) =>
      prev.map((c) => (c.id === criterionId ? { ...c, weight } : c)),
    )
  }

  const activeEval = evaluations.find((e) => e.targetId === activeTargetId)
  const activeScoringResult = activeEval ? scoreTarget(activeEval, criteria) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-1">
          Executive Decision Cockpit
        </p>
        <h2 className="text-[18px] font-bold text-slate-900 leading-tight">
          Target and offer evaluation
        </h2>
        <p className="text-[13px] text-slate-500 mt-1">
          Score targets against what matters to you. Hard constraints disqualify before weighted scoring begins.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {([
          { id: 'rankings', label: 'Rankings' },
          { id: 'criteria', label: 'What matters' },
          { id: 'detail', label: 'Target detail' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${
              view === tab.id
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rankings view */}
      {view === 'rankings' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {rankings.length === 0 && (
              <p className="text-[13px] text-slate-400 py-4 text-center">No targets added yet. Add a target below.</p>
            )}
            {rankings.map((result) => (
              <div
                key={result.targetId}
                className={`rounded-xl border p-4 cursor-pointer transition-colors ${
                  result.isDisqualified
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-200 bg-white hover:border-orange-300'
                }`}
                onClick={() => { setActiveTargetId(result.targetId); setView('detail') }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        result.isDisqualified ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {result.isDisqualified ? '✕' : `#${result.overallRank}`}
                      </span>
                      <p className="text-[14px] font-semibold text-slate-900">{result.targetName}</p>
                    </div>
                    {result.isDisqualified && (
                      <p className="text-[12px] text-red-600 mt-1 ml-8">
                        Disqualified: {result.disqualificationReasons.join(' · ')}
                      </p>
                    )}
                  </div>
                  {!result.isDisqualified && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-slate-400">Fit score</p>
                      <p className="text-[22px] font-bold text-orange-600 leading-none">{result.weightedFitScore}</p>
                    </div>
                  )}
                </div>
                {!result.isDisqualified && (
                  <div className="space-y-1">
                    <ScoreBar score={result.weightedFitScore} color="bg-orange-500" />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Fit</span>
                      <span>Risk: {result.weightedRiskScore}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Add target */}
          <div className="flex gap-2">
            <input
              value={newTargetName}
              onChange={(e) => setNewTargetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTarget()}
              placeholder="Add a target company or role..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-orange-400"
            />
            <button
              onClick={addTarget}
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* What matters - criteria editor */}
      {view === 'criteria' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3">
            <p className="text-[12px] text-amber-800 leading-relaxed">
              <strong>Hard constraints</strong> are must-haves. If a target fails one, it is disqualified before weighted scoring.
              <strong> Weights</strong> set relative importance for everything else.
            </p>
          </div>
          <div className="space-y-2">
            {criteria.map((c) => (
              <div key={c.id} className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                c.isHardConstraint ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{c.label}</p>
                  {c.isCustom && <span className="text-[10px] text-orange-500 font-semibold">Custom</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="text-[10px] text-slate-400">Weight</label>
                  <input
                    aria-label={`Weight for ${c.label}`}
                    title={`Weight for ${c.label}`}
                    type="range"
                    min="1"
                    max="10"
                    value={c.weight}
                    onChange={(e) => updateWeight(c.id, Number(e.target.value))}
                    className="w-20 accent-orange-500"
                    disabled={c.isHardConstraint}
                  />
                  <span className="text-[12px] font-bold text-slate-700 w-4">{c.weight}</span>
                  <button
                    onClick={() => toggleHardConstraint(c.id)}
                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                      c.isHardConstraint
                        ? 'border-red-300 bg-red-100 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600'
                    }`}
                  >
                    {c.isHardConstraint ? '✕ Must-have' : 'Set must-have'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Add custom criterion */}
          <div className="flex gap-2">
            <input
              value={newCriterionLabel}
              onChange={(e) => setNewCriterionLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomCriterion()}
              placeholder="Add a custom factor (e.g. equity upside, team quality)..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-orange-400"
            />
            <button
              onClick={addCustomCriterion}
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors"
            >
              Add factor
            </button>
          </div>
        </div>
      )}

      {/* Target detail view */}
      {view === 'detail' && (
        <div className="space-y-4">
          {evaluations.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-4 text-center">Add a target first from the Rankings tab.</p>
          ) : (
            <>
              {/* Target selector */}
              <div className="flex flex-wrap gap-2">
                {evaluations.map((e) => (
                  <button
                    key={e.targetId}
                    onClick={() => setActiveTargetId(e.targetId)}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      activeTargetId === e.targetId
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-600 hover:border-orange-300'
                    }`}
                  >
                    {e.targetName}
                  </button>
                ))}
              </div>

              {activeEval && activeScoringResult && (
                <div className="space-y-4">
                  {/* Disqualification alert */}
                  {activeScoringResult.isDisqualified && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4">
                      <p className="text-[13px] font-bold text-red-700 mb-1">Disqualified - hard constraint failed</p>
                      <ul className="space-y-1">
                        {activeScoringResult.disqualificationReasons.map((r) => (
                          <li key={r} className="text-[12px] text-red-600">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Score summary */}
                  {!activeScoringResult.isDisqualified && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-600 mb-1">Fit score</p>
                        <p className="text-[32px] font-bold text-emerald-700">{activeScoringResult.weightedFitScore}</p>
                        <ScoreBar score={activeScoringResult.weightedFitScore} color="bg-emerald-500" />
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-red-500 mb-1">Risk score</p>
                        <p className="text-[32px] font-bold text-red-600">{activeScoringResult.weightedRiskScore}</p>
                        <ScoreBar score={activeScoringResult.weightedRiskScore} color="bg-red-400" />
                      </div>
                    </div>
                  )}

                  {/* Criterion scores */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <h4 className="text-[12px] font-bold text-slate-700">Score by criterion</h4>
                    {criteria.map((c) => {
                      const s = activeEval.criterionScores.find((sc) => sc.criterionId === c.id)
                      const score = s?.score ?? 5
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-slate-700 truncate">
                              {c.label}
                              {c.isHardConstraint && <span className="ml-1 text-[10px] text-red-500 font-bold">MUST</span>}
                            </p>
                          </div>
                          <input
                            aria-label={`Score for ${c.label}`}
                            title={`Score for ${c.label}`}
                            type="range"
                            min="1"
                            max="10"
                            value={score}
                            onChange={(e) => updateScore(activeEval.targetId, c.id, Number(e.target.value))}
                            className="w-24 accent-orange-500"
                          />
                          <span className="text-[13px] font-bold text-slate-800 w-4">{score}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Interview reflections */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/20 p-5 space-y-4">
                    <h4 className="text-[12px] font-bold text-blue-800">Interview reflections</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-blue-700 mb-1">Pre-interview thoughts</label>
                        <textarea
                          value={activeEval.preInterviewThoughts ?? ''}
                          onChange={(e) => updateEvalField(activeEval.targetId, 'preInterviewThoughts', e.target.value)}
                          rows={3}
                          placeholder="Concerns, hypotheses, questions to probe before the conversation."
                          className="w-full border border-blue-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-blue-400 resize-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-blue-700 mb-1">Post-interview thoughts</label>
                        <textarea
                          value={activeEval.postInterviewThoughts ?? ''}
                          onChange={(e) => updateEvalField(activeEval.targetId, 'postInterviewThoughts', e.target.value)}
                          rows={3}
                          placeholder="What changed? What surprised you? What is the new concern?"
                          className="w-full border border-blue-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-blue-400 resize-none bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Perceived fit delta', field: 'perceivedFitDelta', hint: '-5 to +5' },
                        { label: 'Confidence delta', field: 'confidenceDelta', hint: '-5 to +5' },
                      ].map(({ label, field, hint }) => (
                        <div key={field}>
                          <label className="block text-[10px] font-semibold text-blue-700 mb-1">{label} <span className="font-normal text-slate-400">({hint})</span></label>
                          <input
                            aria-label={label}
                            title={label}
                            type="number"
                            min="-5"
                            max="5"
                            value={(activeEval as any)[field] ?? ''}
                            onChange={(e) => updateEvalField(activeEval.targetId, field as keyof TargetEvaluation, e.target.value === '' ? undefined : Number(e.target.value) as any)}
                            className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-blue-700 mb-1">Objection notes (by stakeholder)</label>
                      <textarea
                        value={activeEval.objectionNotes ?? ''}
                        onChange={(e) => updateEvalField(activeEval.targetId, 'objectionNotes', e.target.value)}
                        rows={2}
                        placeholder="e.g. Board pushed back on PE experience. CEO asked about team scale. CHRO was uncertain about cultural fit."
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-blue-400 resize-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Tradeoff notes */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <label className="block text-[12px] font-bold text-slate-700 mb-2">Tradeoff notes</label>
                    <textarea
                      value={activeEval.tradeoffNotes ?? ''}
                      onChange={(e) => updateEvalField(activeEval.targetId, 'tradeoffNotes', e.target.value)}
                      rows={3}
                      placeholder="What are you trading off relative to other targets or to your must-haves?"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-orange-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Save */}
      <button
        onClick={() => onSave?.(criteria, evaluations)}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[13px] py-2.5 rounded-lg transition-colors"
      >
        Save cockpit
      </button>
    </div>
  )
}
