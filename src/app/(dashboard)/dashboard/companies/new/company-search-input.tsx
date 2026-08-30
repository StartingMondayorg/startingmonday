'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui'
type RefCompany = {
  id: number
  slug: string
  name: string
  description: string | null
  hq_location: string | null
  industries: string[] | null
  cb_rank: number
}

export function CompanySearchInput({ defaultValue }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue ?? '')
  const [results, setResults] = useState<RefCompany[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/reference/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data: RefCompany[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch {}
    }, 200)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectCompany(company: RefCompany) {
    setQuery(company.name)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative">
      <Command
        shouldFilter={false}
        className="overflow-visible bg-transparent p-0"
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
      >
        <CommandInput
          name="name"
          required
          autoFocus
          value={query}
          onValueChange={(value) => { setQuery(value); search(value); if (value.length >= 2) setOpen(true) }}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder="Search or type a company name"
          className="text-foreground placeholder:text-muted-foreground"
        />
        {open && (
          <div className="relative">
            <CommandList className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border rounded shadow-lg max-h-60">
              <CommandEmpty className="px-3 py-2.5 text-[13px] text-muted-foreground">No matches</CommandEmpty>
              <CommandGroup>
                {results.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.id}`}
                    onSelect={() => selectCompany(c)}
                    className="px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-foreground">{c.name}</div>
                      {c.hq_location && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">{c.hq_location}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}
