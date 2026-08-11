'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SuggestedPerson } from '@/lib/enrichment'

type Props = {
  companyName: string
  sector: string
  suggestedPeople: SuggestedPerson[]
}

export function RecommendationActions({ companyName, sector, suggestedPeople }: Props) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<'contact' | 'outreach' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0)
  const selectedPerson = suggestedPeople[selectedPersonIndex] ?? suggestedPeople[0] ?? null

  async function createContactAndMaybeRoute(mode: 'contact' | 'outreach') {
    if (!selectedPerson) return
    setBusyAction(mode)
    setMessage(null)
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedPerson.name,
          title: selectedPerson.title,
          firm: companyName,
          channel: 'cold',
          notes: `Added from discover recommendation. Reason: ${selectedPerson.reason}`,
          source: mode === 'outreach' ? 'discover_recommendation_outreach' : 'discover_recommendation_contact',
          enrichment_source: selectedPerson.source,
          enrichment_confidence: selectedPerson.confidence,
          enrichment_retention_days: 30,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(payload?.error ?? 'Failed to create contact from recommendation.')
        return
      }

      const createdId = payload?.id as string | undefined
      if (!createdId) {
        setMessage('Contact created but no contact id was returned.')
        return
      }

      if (mode === 'outreach') {
        router.push(`/dashboard/contacts/${createdId}/outreach`)
        return
      }

      setMessage('Contact added. Paste their LinkedIn URL on the edit screen.')
      router.push(`/dashboard/contacts/${createdId}/edit?source=discover_recommendation`)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {suggestedPeople.length > 0 && (
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-[12px] font-semibold text-slate-700 mb-2">Add each recommended person, then paste their LinkedIn URL.</p>
          <label htmlFor="discover-person-picker" className="text-[12px] text-slate-500">Suggested person</label>
          <select
            id="discover-person-picker"
            value={selectedPersonIndex}
            onChange={(event) => setSelectedPersonIndex(Number(event.target.value))}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-[13px] text-slate-700"
          >
            {suggestedPeople.map((person, index) => (
              <option key={`${person.name}-${person.title}-${index}`} value={index}>
                {person.name} - {person.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/discover"
          className="text-center text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded transition-colors"
        >
          Back to recommendations
        </Link>
        <Link
          href={`/dashboard/companies/new?name=${encodeURIComponent(companyName)}&sector=${encodeURIComponent(sector ?? '')}&source=discover_recommendation_detail`}
          className="text-center text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-700 px-4 py-2.5 rounded transition-colors"
        >
          Add company to watchlist
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => createContactAndMaybeRoute('contact')}
          disabled={!selectedPerson || busyAction !== null}
          className="text-center text-[13px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 px-4 py-2.5 rounded transition-colors"
        >
          {busyAction === 'contact' ? 'Adding contact...' : 'Add selected contact + LinkedIn URL'}
        </button>
        <button
          type="button"
          onClick={() => createContactAndMaybeRoute('outreach')}
          disabled={!selectedPerson || busyAction !== null}
          className="text-center text-[13px] font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-4 py-2.5 rounded transition-colors"
        >
          {busyAction === 'outreach' ? 'Preparing draft...' : 'Start outreach draft'}
        </button>
      </div>

      {message && <p className="text-[12px] text-slate-500">{message}</p>}
      {!selectedPerson && <p className="text-[12px] text-slate-500">No suggested people available for direct actions yet.</p>}
    </div>
  )
}
