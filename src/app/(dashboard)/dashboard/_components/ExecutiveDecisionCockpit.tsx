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
import { Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button, Card, Input, Label, Progress, Slider, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Toggle, ToggleGroup, ToggleGroupItem } from '@/components/ui'
interface ExecutiveDecisionCockpitProps {
  initialCriteria?: WhatMattersCriterion[]
  initialEvaluations?: TargetEvaluation[]
  onSave?: (criteria: WhatMattersCriterion[], evaluations: TargetEvaluation[]) => void
}

// Complete literal Tailwind class strings so the compiler can detect them statically.
const INDICATOR_COLOR_CLASS: Record<string, string> = {
  'bg-primary': '[&_[data-slot=progress-indicator]]:bg-primary',
  'bg-success': '[&_[data-slot=progress-indicator]]:bg-success',
  'bg-destructive': '[&_[data-slot=progress-indicator]]:bg-destructive',
}

function ScoreBar({ score, max = 100, color = 'bg-primary' }: { score: number; max?: number; color?: string }) {
  return (
    <Progress
      value={score}
      max={max}
      className={`[&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-muted ${INDICATOR_COLOR_CLASS[color] ?? INDICATOR_COLOR_CLASS['bg-primary']}`}
    />
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
      <Card className="px-5 py-4">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">
          Executive Decision Cockpit
        </p>
        <h2 className="text-[18px] font-bold text-foreground leading-tight">
          Target and offer evaluation
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Score targets against what matters to you. Hard constraints disqualify before weighted scoring begins.
        </p>
      </Card>

      {/* Tab navigation */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'rankings' | 'criteria' | 'detail')}>
        <TabsList className="w-full rounded-xl border border-border bg-muted p-1">
          <TabsTrigger value="rankings" className="flex-1 text-[12px] font-semibold">Rankings</TabsTrigger>
          <TabsTrigger value="criteria" className="flex-1 text-[12px] font-semibold">What matters</TabsTrigger>
          <TabsTrigger value="detail" className="flex-1 text-[12px] font-semibold">Target detail</TabsTrigger>
        </TabsList>

      {/* Rankings view */}
      <TabsContent value="rankings">
        <div className="space-y-4">
          <div className="space-y-3">
            {rankings.length === 0 && (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No targets added yet. Add a target below.</p>
            )}
            {rankings.map((result) => (
              <Card
                key={result.targetId}
                className={`p-4 cursor-pointer transition-colors ${
                  result.isDisqualified
                    ? 'border-destructive/30 bg-destructive/30'
                    : 'hover:border-primary/30'
                }`}
                onClick={() => { setActiveTargetId(result.targetId); setView('detail') }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {result.isDisqualified ? (
                        <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 justify-center">✕</Badge>
                      ) : (
                        <Avatar size="sm" className="bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                            #{result.overallRank}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <p className="text-[14px] font-semibold text-foreground">{result.targetName}</p>
                    </div>
                    {result.isDisqualified && (
                      <p className="text-[12px] text-destructive mt-1 ml-8">
                        Disqualified: {result.disqualificationReasons.join(' · ')}
                      </p>
                    )}
                  </div>
                  {!result.isDisqualified && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-muted-foreground">Fit score</p>
                      <p className="text-[22px] font-bold text-primary leading-none">{result.weightedFitScore}</p>
                    </div>
                  )}
                </div>
                {!result.isDisqualified && (
                  <div className="space-y-1">
                    <ScoreBar score={result.weightedFitScore} color="bg-primary" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Fit</span>
                      <span>Risk: {result.weightedRiskScore}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {/* Add target */}
          <div className="flex gap-2">
            <Input
              value={newTargetName}
              onChange={(e) => setNewTargetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTarget()}
              placeholder="Add a target company or role..."
              className="flex-1 text-[13px]"
            />
            <Button
              onClick={addTarget}
              className="text-[13px] px-4 py-2"
            >
              Add
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* What matters - criteria editor */}
      <TabsContent value="criteria">
        <div className="space-y-4">
          <Alert variant="warning" className="px-4 py-3">
            <AlertDescription className="text-[12px] leading-relaxed">
              <strong>Hard constraints</strong> are must-haves. If a target fails one, it is disqualified before weighted scoring.
              <strong> Weights</strong> set relative importance for everything else.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            {criteria.map((c) => (
              <Card key={c.id} className={`flex-row px-4 py-3 items-center gap-3 ${
                c.isHardConstraint ? 'border-destructive/30 bg-destructive/20' : ''
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{c.label}</p>
                  {c.isCustom && <span className="text-[10px] text-primary font-semibold">Custom</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Label className="text-[10px] font-normal text-muted-foreground">Weight</Label>
                  <Slider
                    aria-label={`Weight for ${c.label}`}
                    title={`Weight for ${c.label}`}
                    min={1}
                    max={10}
                    value={c.weight}
                    onValueChange={(value) => updateWeight(c.id, Array.isArray(value) ? value[0] : value)}
                    className="w-20"
                    disabled={c.isHardConstraint}
                  />
                  <span className="text-[12px] font-bold text-muted-foreground w-4">{c.weight}</span>
                  <Toggle
                    pressed={c.isHardConstraint}
                    onPressedChange={() => toggleHardConstraint(c.id)}
                    className={`h-auto text-[10px] font-bold px-2 py-1 rounded border ${
                      c.isHardConstraint
                        ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10'
                        : 'border-border text-muted-foreground hover:border-destructive/30 hover:text-destructive'
                    }`}
                  >
                    {c.isHardConstraint ? '✕ Must-have' : 'Set must-have'}
                  </Toggle>
                </div>
              </Card>
            ))}
          </div>
          {/* Add custom criterion */}
          <div className="flex gap-2">
            <Input
              value={newCriterionLabel}
              onChange={(e) => setNewCriterionLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomCriterion()}
              placeholder="Add a custom factor (e.g. equity upside, team quality)..."
              className="flex-1 text-[13px]"
            />
            <Button
              onClick={addCustomCriterion}
              className="text-[13px] px-4 py-2"
            >
              Add factor
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Target detail view */}
      <TabsContent value="detail">
        <div className="space-y-4">
          {evaluations.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">Add a target first from the Rankings tab.</p>
          ) : (
            <>
              {/* Target selector */}
              <ToggleGroup
                value={activeTargetId ? [activeTargetId] : []}
                onValueChange={(values) => { if (values[0]) setActiveTargetId(values[0]) }}
                className="flex-wrap gap-2"
              >
                {evaluations.map((e) => (
                  <ToggleGroupItem
                    key={e.targetId}
                    value={e.targetId}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      activeTargetId === e.targetId
                        ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {e.targetName}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {activeEval && activeScoringResult && (
                <div className="space-y-4">
                  {/* Disqualification alert */}
                  {activeScoringResult.isDisqualified && (
                    <Alert variant="destructive" className="border-destructive/30 px-5 py-4">
                      <AlertTitle className="text-[13px] font-bold mb-1">Disqualified - hard constraint failed</AlertTitle>
                      <AlertDescription>
                        <ul className="space-y-1">
                          {activeScoringResult.disqualificationReasons.map((r) => (
                            <li key={r} className="text-[12px] text-destructive">• {r}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Score summary */}
                  {!activeScoringResult.isDisqualified && (
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-success/30 bg-success/30 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-success mb-1">Fit score</p>
                        <p className="text-[32px] font-bold text-success">{activeScoringResult.weightedFitScore}</p>
                        <ScoreBar score={activeScoringResult.weightedFitScore} color="bg-success" />
                      </Card>
                      <Card className="border-destructive/30 bg-destructive/30 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-destructive mb-1">Risk score</p>
                        <p className="text-[32px] font-bold text-destructive">{activeScoringResult.weightedRiskScore}</p>
                        <ScoreBar score={activeScoringResult.weightedRiskScore} color="bg-destructive" />
                      </Card>
                    </div>
                  )}

                  {/* Criterion scores */}
                  <Card className="p-4 space-y-3">
                    <h4 className="text-[12px] font-bold text-muted-foreground">Score by criterion</h4>
                    {criteria.map((c) => {
                      const s = activeEval.criterionScores.find((sc) => sc.criterionId === c.id)
                      const score = s?.score ?? 5
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-muted-foreground truncate">
                              {c.label}
                              {c.isHardConstraint && <span className="ml-1 text-[10px] text-destructive font-bold">MUST</span>}
                            </p>
                          </div>
                          <Slider
                            aria-label={`Score for ${c.label}`}
                            title={`Score for ${c.label}`}
                            min={1}
                            max={10}
                            value={score}
                            onValueChange={(value) => updateScore(activeEval.targetId, c.id, Array.isArray(value) ? value[0] : value)}
                            className="w-24"
                          />
                          <span className="text-[13px] font-bold text-foreground w-4">{score}</span>
                        </div>
                      )
                    })}
                  </Card>

                  {/* Interview reflections */}
                  <Card className="border-info/30 bg-info/20 p-5 space-y-4">
                    <h4 className="text-[12px] font-bold text-info">Interview reflections</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="block text-[10px] font-semibold text-info mb-1">Pre-interview thoughts</Label>
                        <Textarea
                          value={activeEval.preInterviewThoughts ?? ''}
                          onChange={(e) => updateEvalField(activeEval.targetId, 'preInterviewThoughts', e.target.value)}
                          rows={3}
                          placeholder="Concerns, hypotheses, questions to probe before the conversation."
                          className="w-full border-info/30 text-[12px] resize-none bg-card"
                        />
                      </div>
                      <div>
                        <Label className="block text-[10px] font-semibold text-info mb-1">Post-interview thoughts</Label>
                        <Textarea
                          value={activeEval.postInterviewThoughts ?? ''}
                          onChange={(e) => updateEvalField(activeEval.targetId, 'postInterviewThoughts', e.target.value)}
                          rows={3}
                          placeholder="What changed? What surprised you? What is the new concern?"
                          className="w-full border-info/30 text-[12px] resize-none bg-card"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Perceived fit delta', field: 'perceivedFitDelta', hint: '-5 to +5' },
                        { label: 'Confidence delta', field: 'confidenceDelta', hint: '-5 to +5' },
                      ].map(({ label, field, hint }) => (
                        <div key={field}>
                          <Label className="block text-[10px] font-semibold text-info mb-1">{label} <span className="font-normal text-muted-foreground">({hint})</span></Label>
                          <Input
                            aria-label={label}
                            title={label}
                            type="number"
                            min="-5"
                            max="5"
                            value={(activeEval as any)[field] ?? ''}
                            onChange={(e) => updateEvalField(activeEval.targetId, field as keyof TargetEvaluation, e.target.value === '' ? undefined : Number(e.target.value) as any)}
                            className="w-full border-info/30 text-[13px]"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <Label className="block text-[10px] font-semibold text-info mb-1">Objection notes (by stakeholder)</Label>
                      <Textarea
                        value={activeEval.objectionNotes ?? ''}
                        onChange={(e) => updateEvalField(activeEval.targetId, 'objectionNotes', e.target.value)}
                        rows={2}
                        placeholder="e.g. Board pushed back on PE experience. CEO asked about team scale. CHRO was uncertain about cultural fit."
                        className="w-full border-info/30 text-[12px] resize-none bg-card"
                      />
                    </div>
                  </Card>

                  {/* Tradeoff notes */}
                  <Card className="p-4">
                    <Label className="block text-[12px] font-bold text-muted-foreground mb-2">Tradeoff notes</Label>
                    <Textarea
                      value={activeEval.tradeoffNotes ?? ''}
                      onChange={(e) => updateEvalField(activeEval.targetId, 'tradeoffNotes', e.target.value)}
                      rows={3}
                      placeholder="What are you trading off relative to other targets or to your must-haves?"
                      className="w-full text-[13px] resize-none"
                    />
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>
      </Tabs>

      {/* Save */}
      <Button
        onClick={() => onSave?.(criteria, evaluations)}
        className="w-full text-[13px] py-2.5"
      >
        Save cockpit
      </Button>
    </div>
  )
}
