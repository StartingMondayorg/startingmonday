import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { STAGES, TYPE_LABELS } from '../page'
import { addContact, logActivity, updateProspect, deleteMaterial } from './actions'
import { archiveProspect } from '../actions'
import MaterialClient from './material-client'
import { Badge, Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
export const metadata = { title: 'Prospect - B2B Sales' }

const ACTIVITY_TYPES = [
  { value: 'call',      label: 'Call' },
  { value: 'email',     label: 'Email' },
  { value: 'demo',      label: 'Demo' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'intro',     label: 'Intro' },
  { value: 'proposal',  label: 'Proposal' },
  { value: 'other',     label: 'Other' },
]

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()

  const { data: prospect } = await admin
    .from('b2b_prospects')
    .select('*')
    .eq('id', id)
    .single()

  if (!prospect) notFound()

  const [{ data: contacts }, { data: activities }, { data: materials }] = await Promise.all([
    admin.from('b2b_contacts').select('*').eq('prospect_id', id).order('created_at', { ascending: true }),
    admin.from('b2b_activities').select('*').eq('prospect_id', id).order('occurred_at', { ascending: false }),
    admin.from('b2b_materials').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
  ])

  const stage = STAGES.find(s => s.key === prospect.stage)
  const typLabel = TYPE_LABELS[prospect.type] ?? prospect.type

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/b2b" className="text-[13px] text-muted-foreground hover:text-foreground">
              Pipeline
            </Link>
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
{/* Prospect header */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground">{typLabel}</span>
                <Badge variant="outline" className={stage?.cls ?? 'bg-muted text-muted-foreground'}>
                  {stage?.label ?? prospect.stage}
                </Badge>
              </div>
              <h1 className="text-[26px] font-bold text-foreground">{prospect.name}</h1>
              {prospect.website && (
                <a href={prospect.website} target="_blank" rel="noreferrer" className="text-[13px] text-muted-foreground mt-0.5 inline-block">
                  {prospect.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            <div className="text-right shrink-0">
              {prospect.estimated_arr && (
                <div className="text-[20px] font-bold text-foreground">
                  ${prospect.estimated_arr >= 1000 ? `${Math.round(prospect.estimated_arr / 1000)}K` : prospect.estimated_arr}
                  <span className="text-[13px] font-normal text-muted-foreground ml-1">ARR</span>
                </div>
              )}
              {prospect.estimated_seats && (
                <div className="text-[13px] text-muted-foreground">{prospect.estimated_seats} seats</div>
              )}
            </div>
          </div>

          {prospect.notes && (
            <p className="text-[14px] text-muted-foreground mb-5 border-t border-border pt-4">{prospect.notes}</p>
          )}

          {/* Edit form */}
          <Collapsible className="mt-2">
            <CollapsibleTrigger className="text-[13px] font-semibold text-muted-foreground cursor-pointer select-none">
              Edit prospect
            </CollapsibleTrigger>
            <CollapsibleContent>
              <form action={updateProspect} className="mt-4 flex flex-col gap-4">
                <input type="hidden" name="id" value={prospect.id} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Name</Label>
                    <Input name="name" defaultValue={prospect.name} />
                  </div>
                  <div>
                    <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Website</Label>
                    <Input name="website" type="url" defaultValue={prospect.website ?? ''} />
                  </div>
                </div>
                <div>
                  <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Notes</Label>
                  <Textarea name="notes" rows={2} defaultValue={prospect.notes ?? ''} className="resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit">
                    Save changes
                  </Button>
                  <form action={archiveProspect}>
                    <input type="hidden" name="id" value={prospect.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Archive prospect
                    </Button>
                  </form>
                </div>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Contacts */}
        <section>
          <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Contacts</h2>
          <Card className="p-0">
            {(contacts ?? []).length > 0 && (
              <div className="divide-y divide-border">
                {(contacts ?? []).map(c => (
                  <div key={c.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">{c.name}</div>
                      {c.title && <div className="text-[13px] text-muted-foreground">{c.title}</div>}
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.email && <a href={`mailto:${c.email}`} className="text-[13px] text-muted-foreground">{c.email}</a>}
                        {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-[13px] text-muted-foreground">LinkedIn</a>}
                      </div>
                      {c.notes && <p className="text-[13px] text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-4 border-t border-border">
              <Collapsible>
                <CollapsibleTrigger className="text-[13px] font-semibold text-muted-foreground cursor-pointer select-none">
                  + Add contact
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <form action={addContact} className="mt-4 flex flex-col gap-3">
                    <input type="hidden" name="prospect_id" value={prospect.id} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Name *</Label>
                        <Input name="name" required placeholder="Jane Smith" />
                      </div>
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Title</Label>
                        <Input name="title" placeholder="VP of HR" />
                      </div>
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Email</Label>
                        <Input name="email" type="email" placeholder="jane@example.com" />
                      </div>
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">LinkedIn URL</Label>
                        <Input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Notes</Label>
                      <Input name="notes" placeholder="Decision-maker, warm intro via..." />
                    </div>
                    <Button type="submit" className="self-start">
                      Add contact
                    </Button>
                  </form>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Card>
        </section>

        {/* Activity log */}
        <section>
          <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Activity log</h2>
          <Card className="p-0">
            {(activities ?? []).length === 0 ? (
              <div className="px-5 py-6 text-[13px] text-muted-foreground">No activity logged yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {(activities ?? []).map(a => (
                  <div key={a.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {ACTIVITY_TYPES.find(t => t.value === a.activity_type)?.label ?? a.activity_type}
                        </Badge>
                        <span className="text-[13px] text-muted-foreground">{a.occurred_at}</span>
                      </div>
                      {a.logged_by && <span className="text-[13px] text-muted-foreground">{a.logged_by}</span>}
                    </div>
                    <p className="text-[14px] text-foreground mt-1.5">{a.summary}</p>
                    {a.next_action && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Next:</span>
                        <span className="text-[13px] text-muted-foreground">{a.next_action}</span>
                        {a.next_action_due && <span className="text-[13px] text-muted-foreground">by {a.next_action_due}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-4 border-t border-border">
              <Collapsible>
                <CollapsibleTrigger className="text-[13px] font-semibold text-muted-foreground cursor-pointer select-none">
                  + Log activity
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <form action={logActivity} className="mt-4 flex flex-col gap-3">
                    <input type="hidden" name="prospect_id" value={prospect.id} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Type</Label>
                        <Select name="activity_type" defaultValue="call">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Date</Label>
                        <Input name="occurred_at" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Next action due</Label>
                        <Input name="next_action_due" type="date" />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Summary *</Label>
                      <Textarea name="summary" required rows={2} placeholder="What happened, what was discussed..." className="resize-none" />
                    </div>
                    <div>
                      <Label className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Next action</Label>
                      <Input name="next_action" placeholder="Send proposal, schedule follow-up demo..." />
                    </div>
                    <Button type="submit" className="self-start">
                      Log activity
                    </Button>
                  </form>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Card>
        </section>

        {/* Leave-behind materials */}
        <section>
          <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Leave-behind materials</h2>
          <MaterialClient
            prospectId={prospect.id}
            prospectName={prospect.name}
            prospectType={prospect.type}
            estimatedSeats={prospect.estimated_seats}
            estimatedArr={prospect.estimated_arr}
            notes={prospect.notes}
            contacts={(contacts ?? []).slice(0, 1).map(c => ({ name: c.name, title: c.title }))}
          />

          {(materials ?? []).length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {(materials ?? []).map(m => (
                <Card key={m.id} className="p-0">
                  <div className="px-5 py-3 flex items-center justify-between border-b border-border">
                    <div>
                      <span className="text-[14px] font-semibold text-foreground">{m.title}</span>
                      <span className="text-[13px] text-muted-foreground ml-3">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <form action={deleteMaterial}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="prospect_id" value={prospect.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                        Delete
                      </Button>
                    </form>
                  </div>
                  <div className="px-5 py-4 text-[13px] text-muted-foreground whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
                    {m.content}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
