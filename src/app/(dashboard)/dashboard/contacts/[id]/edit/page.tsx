import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateContact } from '../actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const selectTriggerCls = 'w-full border-white/15 bg-slate-950/70 text-slate-100'

// shadcn Select can't have an item with value "" — use this sentinel for the
// "unset" option and strip it back to an empty string in the form action below.
const NONE = '__none__'

const CHANNELS = [
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'referral',  label: 'Referral' },
  { value: 'cold',      label: 'Cold' },
  { value: 'inbound',   label: 'Inbound' },
  { value: 'event',     label: 'Event' },
  { value: 'recruiter', label: 'Recruiter' },
]

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawContact }, { data: companies }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, name, title, firm, channel, email, linkedin_url, notes, company_id, contact_type, last_role_discussed')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single(),
    supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('name', { ascending: true }),
  ])

  if (!rawContact) notFound()

  type ContactRow = typeof rawContact & { email?: string | null; linkedin_url?: string | null; contact_type?: string | null; last_role_discussed?: string | null }
  const contact = rawContact as unknown as ContactRow
  const companyList = companies ?? []

  async function updateContactForm(formData: FormData) {
    'use server'
    for (const key of ['channel', 'company_id', 'contact_type']) {
      if (formData.get(key) === NONE) formData.set(key, '')
    }
    await updateContact(id, formData)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_26%),linear-gradient(180deg,_#0b1220_0%,_#0a1020_46%,_#0b1324_100%)] font-sans text-slate-100">

      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href={`/dashboard/contacts/${id}`} className="text-[13px] text-slate-300 hover:text-white transition-colors">
            Cancel
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-6 rounded-2xl border border-white/15 bg-white/5 px-5 py-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-300">Edit contact</p>
          <h1 className="mt-1 text-[22px] font-bold text-white">{contact.name}</h1>
          <p className="text-[13px] text-slate-200 mt-1">Update relationship details and outreach metadata.</p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <form action={updateContact.bind(null, id)} className="flex flex-col gap-4">

            <div>
              <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                name="name"
                required
                defaultValue={contact.name}
                placeholder="Jane Smith"
                className="bg-slate-950/70 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Title</Label>
                <Input name="title" defaultValue={contact.title ?? ''} placeholder="VP of Engineering" className="bg-slate-950/70 text-slate-100" />
              </div>
              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Firm</Label>
                <Input name="firm" defaultValue={contact.firm ?? ''} placeholder="Korn Ferry" className="bg-slate-950/70 text-slate-100" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Email</Label>
                <Input
                  name="email"
                  type="text"
                  defaultValue={contact.email ?? ''}
                  placeholder="jane@company.com"
                  className="bg-slate-950/70 text-slate-100"
                />
              </div>
              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">LinkedIn URL</Label>
                <Input
                  name="linkedin_url"
                  type="text"
                  defaultValue={contact.linkedin_url ?? ''}
                  placeholder="https://linkedin.com/in/jane"
                  className="bg-slate-950/70 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-channel" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Channel</Label>
                <Select name="channel" defaultValue={contact.channel || NONE}>
                  <SelectTrigger id="contact-channel" title="Channel" className={selectTriggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>-</SelectItem>
                    {CHANNELS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {companyList.length > 0 && (
                <div>
                  <Label htmlFor="contact-company" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Company</Label>
                  <Select name="company_id" defaultValue={contact.company_id || NONE}>
                    <SelectTrigger id="contact-company" title="Company" className={selectTriggerCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>- No company -</SelectItem>
                      {companyList.map(co => (
                        <SelectItem key={co.id} value={co.id}>{co.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-type" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Relationship type</Label>
                <Select name="contact_type" defaultValue={contact.contact_type || NONE}>
                  <SelectTrigger id="contact-type" title="Relationship type" className={selectTriggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>-</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                    <SelectItem value="peer">Peer</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="board">Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Last role discussed</Label>
                <Input
                  name="last_role_discussed"
                  defaultValue={contact.last_role_discussed ?? ''}
                  placeholder="CIO at Acme Corp"
                  className="bg-slate-950/70 text-slate-100"
                />
              </div>
            </div>

            <div>
              <Label className="block text-[13px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-1.5">Notes</Label>
              <Textarea
                name="notes"
                defaultValue={contact.notes ?? ''}
                rows={3}
                placeholder="Met at SaaStr, warm connection..."
                className="bg-slate-950/70 text-slate-100 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                render={<Link href={`/dashboard/contacts/${id}`} />}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save changes
              </Button>
            </div>

          </form>
        </div>

      </main>
    </div>
  )
}

