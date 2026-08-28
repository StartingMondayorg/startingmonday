'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
const ALL = '__none__'

export function SignalFilterBar({
  companyFilter,
  typeFilter,
  companyFilterOptions,
  typeFilterOptions,
}: {
  companyFilter?: string
  typeFilter?: string
  companyFilterOptions: { id: string; name: string }[]
  typeFilterOptions: { value: string; label: string }[]
}) {
  const router = useRouter()
  const [company, setCompany] = useState(companyFilter ?? ALL)
  const [type, setType] = useState(typeFilter ?? ALL)

  function submit() {
    const sp = new URLSearchParams()
    if (company !== ALL) sp.set('company', company)
    if (type !== ALL) sp.set('type', type)
    const qs = sp.toString()
    router.push(`/dashboard/signals${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={company} onValueChange={(value) => setCompany(value ?? ALL)}>
        <SelectTrigger aria-label="Filter by company" className="bg-muted/40 text-foreground border-border">
          <SelectValue placeholder="All companies" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All companies</SelectItem>
          {companyFilterOptions.map((companyOption) => (
            <SelectItem key={companyOption.id} value={companyOption.id}>{companyOption.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(value) => setType(value ?? ALL)}>
        <SelectTrigger aria-label="Filter by type" className="bg-muted/40 text-foreground border-border">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {typeFilterOptions.map((typeOption) => (
            <SelectItem key={typeOption.value} value={typeOption.value}>{typeOption.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" onClick={submit}>
        Filter
      </Button>

      {(companyFilter || typeFilter) && (
        <Button variant="ghost" render={<a href="/dashboard/signals" />}>
          Clear
        </Button>
      )}
    </div>
  )
}
