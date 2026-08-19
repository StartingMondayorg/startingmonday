import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { createProspect } from '../actions'
import { TYPE_LABELS } from '../page'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Add Prospect - B2B Sales' }

export default async function NewProspectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href="/dashboard/admin/b2b" className="text-[13px] text-slate-300 hover:text-white">
            Pipeline
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-7">
          <h1 className="text-[24px] font-bold text-slate-900">Add prospect</h1>
          <p className="text-[13px] text-slate-500 mt-1">Start tracking a new B2B sales conversation.</p>
        </div>

        <form action={createProspect}>
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">
              Organization name <span className="text-red-400">*</span>
            </Label>
            <Input
              name="name"
              type="text"
              required
              placeholder="e.g. Lee Hecht Harrison, Wharton School, Sequoia Capital"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">
                Prospect type
              </Label>
              <Select name="type" defaultValue="outplacement">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">
                Website
              </Label>
              <Input
                name="website"
                type="url"
                placeholder="https://"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">
                Estimated seats
              </Label>
              <Input
                name="estimated_seats"
                type="number"
                min="1"
                placeholder="e.g. 100"
              />
            </div>

            <div>
              <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">
                Estimated ARR (USD)
              </Label>
              <Input
                name="estimated_arr"
                type="number"
                min="0"
                placeholder="e.g. 48000"
              />
            </div>
          </div>

          <div>
            <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">
              Notes
            </Label>
            <Textarea
              name="notes"
              rows={3}
              placeholder="How we know them, warm intro, key context..."
              className="resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit">
              Add prospect
            </Button>
            <Link href="/dashboard/admin/b2b" className="text-[13px] text-slate-400 hover:text-slate-700">
              Cancel
            </Link>
          </div>
        </Card>
        </form>
      </main>
    </div>
  )
}
