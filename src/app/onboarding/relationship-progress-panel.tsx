'use client'

import { Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
export type RelationshipStatusPayload = {
  companies: Array<{
    companyId: string
    name: string
    contacts: number
    enrichedContacts: number
    status: string
  }>
  progress: {
    total: number
    completed: number
    done: boolean
    totalContacts: number
    totalEnriched: number
  }
}

export function RelationshipProgressPanel({
  enrichmentStarted,
  progress,
  contactName,
  contactTitle,
  contactCompanyName,
  selectedCompanyId,
  addingContact,
  onContactName,
  onContactTitle,
  onContactCompanyName,
  onSelectedCompany,
  onAddContact,
}: {
  enrichmentStarted: boolean
  progress: RelationshipStatusPayload | null
  contactName: string
  contactTitle: string
  contactCompanyName: string
  selectedCompanyId: string
  addingContact: boolean
  onContactName: (value: string) => void
  onContactTitle: (value: string) => void
  onContactCompanyName: (value: string) => void
  onSelectedCompany: (value: string) => void
  onAddContact: () => void
}) {
  const rows = progress?.companies ?? []
  const done = progress?.progress?.done ?? false
  const canAdd = rows.length > 0
  const effectiveSelectedCompanyId = selectedCompanyId || rows[0]?.companyId || ''
  const canSubmit = Boolean(contactName.trim()) && (canAdd ? Boolean(effectiveSelectedCompanyId) : Boolean(contactCompanyName.trim()))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Start mapping relationships while enrichment runs.
        </h1>
        <p className="text-[15px] text-muted-foreground">
          We are identifying likely decision-path contacts for your target companies now. Add anyone you already know in parallel.
        </p>
      </div>

      <Card variant="glass" className="rounded-lg border-border bg-muted/40 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Relationship enrichment</p>
          <span className="text-[12px] text-muted-foreground">{done ? 'Contact map ready' : enrichmentStarted ? 'Finding contacts...' : 'Waiting to start'}</span>
        </div>

        {rows.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <div key={row.companyId} className="flex items-center justify-between gap-3 border border-border rounded px-3 py-2 bg-background/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={[
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      row.status === 'complete' ? 'bg-success' : 'bg-primary animate-pulse',
                    ].join(' ')}
                  />
                  <span className="text-[13px] text-foreground truncate">{row.name}</span>
                </div>
                <span className="text-[12px] text-muted-foreground shrink-0">
                  {row.contacts} total, {row.enrichedContacts} enriched
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Add companies first so we can build your contact map.
          </p>
        )}

        <p className="text-[12px] text-muted-foreground">
          {progress?.progress?.totalContacts ?? 0} contacts tracked, {progress?.progress?.totalEnriched ?? 0} discovered by enrichment.
        </p>
      </Card>

      <Card variant="glass" className="rounded-lg border-border bg-background/40 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Add a contact now</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Input
            type="text"
            value={contactName}
            onChange={(event) => onContactName(event.target.value)}
            placeholder="Contact name"
            className="w-full !border-border !bg-background/60 text-[13px] text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="text"
            value={contactTitle}
            onChange={(event) => onContactTitle(event.target.value)}
            placeholder="Title (optional)"
            className="w-full !border-border !bg-background/60 text-[13px] text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
          {canAdd ? (
            <Select value={effectiveSelectedCompanyId || undefined} onValueChange={(value) => onSelectedCompany(value ?? '')}>
              <SelectTrigger aria-label="Company for contact" className="flex-1 w-full !border-border !bg-background/60 text-[13px] text-foreground">
                <SelectValue placeholder="Choose a company" />
              </SelectTrigger>
              <SelectContent>
                {rows.map((row) => (
                  <SelectItem key={row.companyId} value={row.companyId}>{row.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              value={contactCompanyName}
              onChange={(event) => onContactCompanyName(event.target.value)}
              placeholder="Company name"
              aria-label="Company for contact"
              className="flex-1 !border-border !bg-background/60 text-[13px] text-foreground placeholder:text-muted-foreground"
            />
          )}
          <Button
            type="button"
            onClick={onAddContact}
            disabled={addingContact || !canSubmit}
            className="!border-border !bg-muted/60 text-foreground text-[13px] font-semibold hover:!bg-muted/80"
          >
            {addingContact ? 'Adding...' : 'Add contact'}
          </Button>
        </div>
        {!canAdd && (
          <p className="text-[12px] text-muted-foreground">
            Company list is still loading. Type the company name and we will create it with your contact.
          </p>
        )}
      </Card>
    </div>
  )
}
