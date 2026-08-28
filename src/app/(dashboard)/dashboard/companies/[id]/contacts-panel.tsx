import Link from 'next/link'
import { addContact, archiveContact, logRelationshipTouchpoint, addRelationshipQuickNote } from './actions'
import { CHANNEL, OUTREACH_STATUS } from './company-detail-constants'
import { Badge, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
// shadcn Select can't have an item with value "" — use this sentinel for the
// "unset" channel option and strip it back to an empty string in the wrapper below.
const NONE = '__none__'

type ContactRow = {
  id: string
  name: string
  title: string | null
  firm: string | null
  channel: string | null
  notes: string | null
  outreach_status: string | null
}

type Props = {
  companyId: string
  contacts: ContactRow[]
  nextFollowUpByContact: Map<string, { due_date: string; action: string }>
  todayISO: string
}

export function ContactsPanel(props: Props) {
  const { companyId, contacts, nextFollowUpByContact, todayISO } = props

  async function addContactForm(formData: FormData) {
    'use server'
    if (formData.get('channel') === NONE) formData.set('channel', '')
    await addContact(companyId, formData)
  }

  return (
    <>
      {contacts.length > 0 && (
        <div className="divide-y divide-border">
          {contacts.map((ct) => {
            const ch = ct.channel ? (CHANNEL[ct.channel] ?? { label: ct.channel, cls: 'bg-muted/60 text-muted-foreground' }) : null
            const os = OUTREACH_STATUS[ct.outreach_status ?? 'prospect'] ?? OUTREACH_STATUS.prospect
            const nextFollowUp = nextFollowUpByContact.get(ct.id)
            const nextAction = nextFollowUp
              ? `Follow up ${new Date(nextFollowUp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : ct.outreach_status === 'prospect'
                ? 'Draft first outreach'
                : ct.outreach_status === 'meeting_scheduled'
                  ? 'Prep for meeting'
                  : ct.outreach_status === 'closed'
                    ? 'Keep warm monthly'
                    : 'Set next follow-up'
            return (
              <div key={ct.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/dashboard/contacts/${ct.id}`} className="text-[14px] font-semibold text-muted-foreground hover:text-foreground">
                      {ct.name}
                    </Link>
                    {ct.title && <span className="text-[13px] text-muted-foreground">{ct.title}{ct.firm ? ` - ${ct.firm}` : ''}</span>}
                    {ch && <Badge className={`tracking-[0.04em] ${ch.cls}`}>{ch.label}</Badge>}
                    <Badge className={os.cls}>{os.label}</Badge>
                  </div>
                  {ct.notes && <p className="text-[12px] text-muted-foreground mt-1 truncate max-w-xl">{ct.notes}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Next relationship action: <span className="font-semibold text-muted-foreground">{nextAction}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <form action={logRelationshipTouchpoint.bind(null, ct.id, companyId)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-success"
                    >
                      Log touch
                    </Button>
                  </form>
                  <form action={addRelationshipQuickNote.bind(null, ct.id, companyId)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-info"
                    >
                      Add note
                    </Button>
                  </form>
                  <Link href={`/dashboard/contacts/${ct.id}/outreach`} className="text-[11px] text-muted-foreground hover:text-foreground font-medium">
                    Draft
                  </Link>
                  <form action={archiveContact.bind(null, ct.id, companyId)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="px-6 py-5 border-t border-border bg-muted/40">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Add person</div>
        <form id="add-contact-form" action={addContactForm} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                name="name"
                type="text"
                required
                placeholder="Jane Smith"
                className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border bg-muted/40"
              />
            </div>
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Title</Label>
              <Input
                name="title"
                type="text"
                placeholder="VP Engineering"
                className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border bg-muted/40"
              />
            </div>
            <div>
              <Label htmlFor="channel" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Channel</Label>
              <Select name="channel" defaultValue={NONE}>
                <SelectTrigger id="channel" className="w-full text-[13px] text-foreground focus-visible:border-border bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>-</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Email</Label>
              <Input
                name="email"
                type="text"
                placeholder="jane@company.com"
                className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border bg-muted/40"
              />
            </div>
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">LinkedIn URL</Label>
              <Input
                name="linkedin_url"
                type="text"
                placeholder="https://linkedin.com/in/jane"
                className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border bg-muted/40"
              />
            </div>
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Notes</Label>
            <Input
              name="notes"
              type="text"
              placeholder="Met at SaaStr, warm connection..."
              className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border bg-muted/40"
            />
          </div>
          <div>
            <Button type="submit" className="text-[13px] font-semibold px-5">
              Add person
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
