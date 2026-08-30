'use client'
import { useTransition } from 'react'
import { updateProspectStage } from './actions'
import type { STAGES } from './page'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
type Props = {
  id: string
  stage: string
  stages: typeof STAGES
  cls: string
}

export default function StageSelect({ id, stage, stages, cls }: Props) {
  const [, startTransition] = useTransition()

  function handleChange(newStage: string | null) {
    if (!newStage) return
    const formData = new FormData()
    formData.set('id', id)
    formData.set('stage', newStage)
    startTransition(() => { updateProspectStage(formData) })
  }

  return (
    <Select value={stage} onValueChange={handleChange}>
      <SelectTrigger
        className={`h-auto text-[11px] font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer [&_svg]:size-3 ${cls}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map(s => (
          <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
