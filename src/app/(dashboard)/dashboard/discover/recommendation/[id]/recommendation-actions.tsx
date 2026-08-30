'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SuggestedPerson } from '@/lib/enrichment'
import { Button, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
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
        <Card variant="default" className="bg-muted p-3">
          <p className="text-[12px] font-semibold text-muted-foreground mb-2">Add each recommended person, then paste their LinkedIn URL.</p>
          <Label htmlFor="discover-person-picker" className="text-[12px] text-muted-foreground font-normal">Suggested person</Label>
          <Select
            value={String(selectedPersonIndex)}
            onValueChange={(value) => setSelectedPersonIndex(Number(value))}
          >
            <SelectTrigger id="discover-person-picker" className="mt-1 w-full bg-card text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {suggestedPeople.map((person, index) => (
                <SelectItem key={`${person.name}-${person.title}-${index}`} value={String(index)}>
                  {person.name} - {person.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" variant="secondary" className="flex-1" render={<Link href="/dashboard/discover" />}>
          Back to recommendations
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          render={<Link href={`/dashboard/companies/new?name=${encodeURIComponent(companyName)}&sector=${encodeURIComponent(sector ?? '')}&source=discover_recommendation_detail`} />}
        >
          Add company to watchlist
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => createContactAndMaybeRoute('contact')}
          disabled={!selectedPerson || busyAction !== null}
        >
          {busyAction === 'contact' ? 'Adding contact...' : 'Add selected contact + LinkedIn URL'}
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={() => createContactAndMaybeRoute('outreach')}
          disabled={!selectedPerson || busyAction !== null}
        >
          {busyAction === 'outreach' ? 'Preparing draft...' : 'Start outreach draft'}
        </Button>
      </div>

      {message && <p className="text-[12px] text-muted-foreground">{message}</p>}
      {!selectedPerson && <p className="text-[12px] text-muted-foreground">No suggested people available for direct actions yet.</p>}
    </div>
  )
}
