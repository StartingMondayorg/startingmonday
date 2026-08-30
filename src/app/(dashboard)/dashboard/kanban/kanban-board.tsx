'use client'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { moveCompanyStage } from './actions'

type Company = {
  id: string
  name: string
  sector: string | null
  fit_score: number | null
  stage: string
}

const STAGES: { key: string; label: string }[] = [
  { key: 'watching',     label: 'Watching' },
  { key: 'researching',  label: 'Researching' },
  { key: 'applied',      label: 'In Process' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offer',        label: 'Offer' },
]

const STAGE_ACCENT: Record<string, string> = {
  watching:     'border-border',
  researching:  'border-info/30',
  applied:      'border-info/30',
  interviewing: 'border-warning/30',
  offer:        'border-success/30',
}

const STAGE_HEADER: Record<string, string> = {
  watching:     'text-muted-foreground',
  researching:  'text-info',
  applied:      'text-info',
  interviewing: 'text-warning',
  offer:        'text-success',
}

const PREP_STAGES = new Set(['interviewing', 'applied', 'offer'])

function CompanyCard({ company, isDragging = false, hasSalaryIntel = false }: { company: Company; isDragging?: boolean; hasSalaryIntel?: boolean }) {
  const showPrep = !isDragging && PREP_STAGES.has(company.stage)
  const showSalary = !isDragging && company.stage === 'offer'
  return (
    <div className={`bg-card border rounded p-3.5 shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 rotate-1 shadow-lg' : 'border-border'}`}>
      <Link
        href={`/dashboard/companies/${company.id}`}
        onClick={e => { if (isDragging) e.preventDefault() }}
        className="block"
      >
        <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{company.name}</p>
        {company.sector && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{company.sector}</p>
        )}
        {company.fit_score !== null && (
          <p className="text-[12px] font-bold text-muted-foreground mt-2">Fit: {company.fit_score}</p>
        )}
      </Link>
      {(showPrep || showSalary) && (
        <div className="mt-2.5 border-t border-border pt-2.5 flex items-center gap-3">
          {showPrep && (
            <Link
              href={`/dashboard/companies/${company.id}/prep`}
              onClick={e => e.stopPropagation()}
              className="text-[11px] font-semibold text-warning"
            >
              Prep brief →
            </Link>
          )}
          {showSalary && (
            <Link
              href={hasSalaryIntel
                ? `/dashboard/salary?company=${encodeURIComponent(company.name)}`
                : '/settings/billing'}
              onClick={e => e.stopPropagation()}
              className="text-[11px] font-semibold text-success"
            >
              Salary intel →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function DraggableCard({ company, hasSalaryIntel }: { company: Company; hasSalaryIntel: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: company.id,
    data: { company },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <CompanyCard company={company} isDragging={isDragging} hasSalaryIntel={hasSalaryIntel} />
    </div>
  )
}

function DroppableColumn({
  stage,
  companies,
  isOver,
  hasSalaryIntel,
}: {
  stage: { key: string; label: string }
  companies: Company[]
  isOver: boolean
  hasSalaryIntel: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage.key })
  const accent = STAGE_ACCENT[stage.key] ?? 'border-border'
  const header = STAGE_HEADER[stage.key] ?? 'text-muted-foreground'

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded border-t-2 ${accent} bg-muted min-h-[400px] transition-colors ${isOver ? 'bg-muted ring-2 ring-border ring-inset' : ''}`}
    >
      <div className="px-3 py-3 flex items-center justify-between border-b border-border bg-card rounded-t">
        <span className={`text-[11px] font-bold tracking-[0.1em] uppercase ${header}`}>
          {stage.label}
        </span>
        <span className="text-[11px] text-muted-foreground">{companies.length}</span>
      </div>
      <div className="flex flex-col gap-2.5 p-3 flex-1">
        {companies.map(co => (
          <DraggableCard key={co.id} company={co} hasSalaryIntel={hasSalaryIntel} />
        ))}
        {companies.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[12px] text-muted-foreground">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ initialCompanies, hasSalaryIntel = false }: { initialCompanies: Company[]; hasSalaryIntel?: boolean }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeCompany = activeId ? companies.find(c => c.id === activeId) : null

  const byStage = useCallback((key: string) => companies.filter(c => c.stage === key), [companies])

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragOver({ over }: { over: DragEndEvent['over'] }) {
    setOverColumn(over ? (over.id as string) : null)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setOverColumn(null)
    if (!over) return

    const companyId = active.id as string
    const newStage  = over.id as string
    const company   = companies.find(c => c.id === companyId)
    if (!company || company.stage === newStage) return

    setCompanies(prev =>
      prev.map(c => c.id === companyId ? { ...c, stage: newStage } : c)
    )

    const result = await moveCompanyStage(companyId, newStage)
    if (!result.ok) {
      setCompanies(prev =>
        prev.map(c => c.id === companyId ? { ...c, stage: company.stage } : c)
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-5 gap-3">
        {STAGES.map(stage => (
          <DroppableColumn
            key={stage.key}
            stage={stage}
            companies={byStage(stage.key)}
            isOver={overColumn === stage.key}
            hasSalaryIntel={hasSalaryIntel}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCompany ? <CompanyCard company={activeCompany} hasSalaryIntel={hasSalaryIntel} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
