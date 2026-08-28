'use client'
import { useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
const INTEREST_OPTIONS = [
  'Executive coaching integration',
  'Coach firm rollout (multiple coaches)',
  'Coach + client referral model',
  'Search firm / retained firm',
  'Outplacement services',
  'PE operating partner network',
  'Relocation firm partnership',
  'Other',
]

const LABEL_CLS = 'block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5'

type PartnersFormProps = {
  introLabel?: string
  introNote?: string
  defaultInterest?: string
  companyPlaceholder?: string
  emailPlaceholder?: string
  rolePlaceholder?: string
  notesPlaceholder?: string
}

export function PartnersForm({
  introLabel = 'Coach partner application',
  introNote = 'Short form. Clear next step.',
  defaultInterest = 'Executive coaching integration',
  companyPlaceholder = 'Acme Executive Coaching',
  emailPlaceholder = 'jane@acmecoaching.com',
  rolePlaceholder = 'Founder, Executive Coach',
  notesPlaceholder = 'Client count, practice model, timeline...',
}: PartnersFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [interests, setInterests] = useState(defaultInterest)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: get('name'),
          email: get('email'),
          company: get('company'),
          role: get('role'),
          interests,
          how_heard: get('how_heard'),
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Email us directly at partners@startingmonday.app.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Alert variant="success" className="p-6">
        <AlertDescription className="text-success">
          <p className="text-[15px] font-semibold text-success mb-1">Application received.</p>
          <p className="text-[13px] text-success">Check your inbox. We will follow up within 2 business days with your partner next steps.</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="rounded-2xl p-6 sm:p-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">{introLabel}</p>
      <p className="mb-6 text-[13px] text-muted-foreground">{introNote}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="p-name" className={LABEL_CLS}>Full name</Label>
            <Input id="p-name" name="name" type="text" required placeholder="Jane Smith" />
          </div>
          <div>
            <Label htmlFor="p-company" className={LABEL_CLS}>Practice or company</Label>
            <Input id="p-company" name="company" type="text" required placeholder={companyPlaceholder} />
          </div>
        </div>
        <div>
          <Label htmlFor="p-email" className={LABEL_CLS}>Work email</Label>
          <Input id="p-email" name="email" type="email" required placeholder={emailPlaceholder} />
        </div>
        <div>
          <Label htmlFor="p-role" className={LABEL_CLS}>Your role</Label>
          <Input id="p-role" name="role" type="text" required placeholder={rolePlaceholder} />
        </div>
        <div>
          <Label htmlFor="p-interests" className={LABEL_CLS}>Partnership model</Label>
          <Select name="interests" value={interests} onValueChange={(value) => { if (value) setInterests(value) }}>
            <SelectTrigger id="p-interests" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTEREST_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-how-heard" className={LABEL_CLS}>
            Anything we should know before we reply? <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="p-how-heard" name="how_heard" type="text" placeholder={notesPlaceholder} />
        </div>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto mt-2">
          {loading ? 'Sending...' : 'Apply now'}
        </Button>
      </form>
    </Card>
  )
}
