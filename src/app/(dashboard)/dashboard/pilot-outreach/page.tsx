
"use client"
import { useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Textarea } from '@/components/ui'
export default function PilotOutreachForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const res = await fetch('/api/pilot-outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setStatus(res.ok ? 'sent' : 'error')
  }

  return (
    <form className="max-w-lg mx-auto mt-12" onSubmit={handleSubmit}>
      <Card className="p-8">
        <h1 className="sr-only">Pilot Outreach</h1>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Pilot Outreach</h2>
        <p className="mb-6 text-muted-foreground">Request a pilot or partnership. We'll get back to you within 1 business day.</p>
        <div className="mb-4">
          <Input required placeholder="Your Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="mb-4">
          <Input required type="email" placeholder="Your Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="mb-4">
          <Input required placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
        </div>
        <div className="mb-4">
          <Textarea placeholder="Message (optional)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
        </div>
        <Button type="submit" disabled={status==='sending'}>
          {status==='sending' ? 'Sending...' : 'Request Pilot'}
        </Button>
        {status==='sent' && (
          <Alert variant="success" className="mt-4">
            <AlertDescription>Thank you! We'll be in touch soon.</AlertDescription>
          </Alert>
        )}
        {status==='error' && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>
        )}
      </Card>
    </form>
  )
}
