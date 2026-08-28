import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addCompany } from './actions'
import { CompanySearchInput } from './company-search-input'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
// shadcn Select can't have an item with value "" — use this sentinel for the
// "Unknown" company-size option. addCompany() already treats any value outside
// the valid size set as null, so no server-side normalization is needed.
const NONE = '__none__'

const STAGES = [
  { value: 'watching',     label: 'Watching' },
  { value: 'researching',  label: 'Researching' },
  { value: 'applied',      label: 'In Process' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',        label: 'Offer' },
]

export default async function AddCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error, name: prefillName } = await searchParams
  const errorMsg =
    error === 'duplicate' ? 'A company with that name is already in your pipeline.' :
    error === 'required'  ? 'Company name is required.' :
    error === 'limit'     ? 'You have reached the 25-company limit. Upgrade to Executive for an unlimited pipeline, or archive a company to make room.' :
    null

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">


      <header className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link
            href="/dashboard"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Add company</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Add a company to your pipeline to track and monitor.</p>
        </div>

        <Alert className="mb-4 max-w-xl px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-md">
          <AlertDescription className="text-[12px] text-muted-foreground">Need examples for targeting and pipeline setup?</AlertDescription>
          <Button
            variant="link"
            className="text-[12px] font-semibold text-primary"
            render={<Link href="/guide?q=Where+do+I+add+companies+to+my+target+list%3F" />}
          >
            Open Guide
          </Button>
        </Alert>

        <Card variant="glass" className="rounded-xl p-5 sm:p-8 max-w-xl shadow-lg">

          {errorMsg && (
            <Alert variant="destructive" className="mb-6 px-4 py-3">
              <AlertDescription className="text-[13px]">{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form action={addCompany} className="flex flex-col gap-5">

            <div>
              <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Company name <span className="text-destructive">*</span>
              </Label>
              <CompanySearchInput defaultValue={prefillName} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Stage
                </Label>
                <Select name="stage" defaultValue="watching">
                  <SelectTrigger className="w-full text-[14px] text-foreground focus-visible:border-primary/30 bg-card/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Fit score <span className="text-muted-foreground font-normal">(1–10)</span>
                </Label>
                <Input
                  name="fit_score"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="-"
                  className="w-full text-[14px] text-foreground bg-card/70 placeholder:text-muted-foreground focus-visible:border-primary/30"
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">1 = weak fit &middot; 10 = dream company</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Sector
                </Label>
                <Input
                  name="sector"
                  type="text"
                  placeholder="e.g. Healthcare, Fintech"
                  className="w-full text-[14px] text-foreground bg-card/70 placeholder:text-muted-foreground focus-visible:border-primary/30"
                />
              </div>
              <div>
                <Label htmlFor="company_size" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Company size
                </Label>
                <Select name="company_size" defaultValue={NONE}>
                  <SelectTrigger id="company_size" className="w-full text-[14px] text-foreground focus-visible:border-primary/30 bg-card/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unknown</SelectItem>
                    <SelectItem value="startup">Startup (under 200)</SelectItem>
                    <SelectItem value="midmarket">Mid-Market (200-2,000)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (2,000+)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-[12px] text-muted-foreground">Used to calibrate CTO prep briefs</p>
              </div>
            </div>

            <div>
              <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Company website
              </Label>
              <Input
                name="company_url"
                type="text"
                placeholder="acme.com or https://acme.com"
                className="w-full text-[14px] text-foreground bg-card/70 placeholder:text-muted-foreground focus-visible:border-primary/30"
              />
              <p className="mt-1.5 text-[12px] text-muted-foreground">Main URL - used to discover press room and leadership page</p>
            </div>

            <div>
              <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Career page URL
              </Label>
              <Input
                name="career_page_url"
                type="text"
                placeholder="acme.com/careers or https://acme.com/careers"
                className="w-full text-[14px] text-foreground bg-card/70 placeholder:text-muted-foreground focus-visible:border-primary/30"
              />
              <p className="mt-1.5 text-[12px] text-muted-foreground">Used in job scans - runs Mon / Wed / Fri</p>
            </div>

            <div>
              <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Notes
              </Label>
              <Textarea
                name="notes"
                rows={3}
                placeholder="Warm intro through Sarah, strong culture fit…"
                className="w-full text-[14px] text-foreground bg-card/70 placeholder:text-muted-foreground focus-visible:border-primary/30 resize-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <Button
                type="submit"
                className="text-[14px] px-6"
              >
                Add to pipeline
              </Button>
              <Link
                href="/dashboard"
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </Link>
            </div>

          </form>
        </Card>
      </main>
    </div>
  )
}

