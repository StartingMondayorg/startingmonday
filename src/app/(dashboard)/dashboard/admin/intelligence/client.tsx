'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge, Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea } from '@/components/ui'
type Token = { id: string; label: string | null; expires_at: string | null; created_at: string }
type IntelCompany = {
  slug: string
  company_name: string
  sector: string | null
  website: string | null
  is_featured: boolean
  signalCount: number
  tokens: Token[]
}

export function IntelligenceAdminClient({
  companies: initial,
  appUrl,
}: {
  companies: IntelCompany[]
  appUrl: string
}) {
  const [companies, setCompanies] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tokenLoading, setTokenLoading] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Add company form state
  const [newName, setNewName]     = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [newSector, setNewSector] = useState('')
  const [newWebsite, setNewWebsite] = useState('')

  // B2B finder state
  const [finderQuery, setFinderQuery] = useState('')
  const [finderResults, setFinderResults] = useState<{ name: string; domain: string; industry: string; size: string }[]>([])
  const [finding, setFinding] = useState(false)

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/intelligence/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: newName.trim(),
          description: newDesc.trim() || undefined,
          sector: newSector.trim() || undefined,
          website: newWebsite.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to add company'); return }

      const newEntry: IntelCompany = {
        slug: data.slug,
        company_name: newName.trim(),
        sector: newSector.trim() || null,
        website: newWebsite.trim() || null,
        is_featured: false,
        signalCount: 0,
        tokens: [],
      }
      setCompanies(c => [newEntry, ...c])
      setNewName(''); setNewDesc(''); setNewSector(''); setNewWebsite('')
      setAddOpen(false)
      toast.success(`${newEntry.company_name} added to intelligence.`)
    } finally {
      setSaving(false)
    }
  }

  async function generateToken(slug: string, companyName: string) {
    setTokenLoading(slug)
    try {
      const label = `${companyName} - B2B demo ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      const res = await fetch('/api/intelligence/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, label, expiresInDays: 30 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to generate link'); return }

      const url = `${appUrl}/intelligence/${slug}?t=${data.tokenId}`
      await navigator.clipboard.writeText(url)
      setCopiedId(data.tokenId)
      setTimeout(() => setCopiedId(null), 3000)

      const newToken: Token = {
        id: data.tokenId,
        label,
        expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
        created_at: new Date().toISOString(),
      }
      setCompanies(cs =>
        cs.map(c => c.slug === slug ? { ...c, tokens: [newToken, ...c.tokens] } : c)
      )
      toast.success('Link copied to clipboard. Valid for 30 days.')
    } finally {
      setTokenLoading(null)
    }
  }

  async function handleFinder(e: React.FormEvent) {
    e.preventDefault()
    if (!finderQuery.trim()) return
    setFinding(true)
    setFinderResults([])
    try {
      // Use our search API to look up companies by sector/keyword
      const res = await fetch(`/api/search?q=${encodeURIComponent(finderQuery)}`)
      const data = await res.json()
      // Map companies from our DB as B2B prospects
      const results = (data.companies ?? []).map((c: { name: string; sector?: string }) => ({
        name: c.name,
        domain: '',
        industry: c.sector ?? 'Unknown',
        size: '',
      }))
      setFinderResults(results)
      if (results.length === 0) toast.info('No companies found. Try a different keyword.')
    } finally {
      setFinding(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground hover:text-primary-foreground">
              Admin
            </Link>
            <span className="text-primary-foreground">/</span>
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-primary">
              Intelligence
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Company Intelligence</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage public intelligence pages and generate ungated links for B2B demos.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" render={<Link href="/dashboard/admin/intelligence/qa" />}>
              QA scorecard
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              + Add company
            </Button>
          </div>
        </div>

        {/* Add company modal */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add company to intelligence</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCompany} className="flex flex-col gap-4">
              <div>
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Company name *</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Accenture" />
              </div>
              <div>
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Description</Label>
                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="One-line description for the public page..." className="resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Sector</Label>
                  <Input value={newSector} onChange={e => setNewSector(e.target.value)} placeholder="Consulting" />
                </div>
                <div>
                  <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Website</Label>
                  <Input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="accenture.com" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="text-muted-foreground">Cancel</Button>
                <Button
                  type="submit"
                  disabled={saving || !newName.trim()}
                >
                  {saving ? 'Saving...' : 'Add company'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Companies list */}
        {companies.length > 0 && (
          <div className="flex flex-col gap-4 mb-10">
            {companies.map(co => (
              <Card key={co.slug} className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-[16px] font-bold text-foreground">{co.company_name}</span>
                      {co.sector && <span className="text-[11px] text-muted-foreground">{co.sector}</span>}
                      <Badge variant="secondary">
                        {co.signalCount} signals
                      </Badge>
                    </div>
                    {co.website && (
                      <a href={co.website.startsWith('http') ? co.website : `https://${co.website}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-muted-foreground">
                        {co.website}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" render={<Link href={`/intelligence/${co.slug}`} target="_blank" />}>
                      View public &nearr;
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generateToken(co.slug, co.company_name)}
                      disabled={tokenLoading === co.slug}
                    >
                      {tokenLoading === co.slug ? 'Generating...' : 'Generate ungated link'}
                    </Button>
                  </div>
                </div>

                {/* Token list */}
                {co.tokens.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Active links</div>
                    <div className="flex flex-col gap-1.5">
                      {co.tokens.map(tok => {
                        const url = `${appUrl}/intelligence/${co.slug}?t=${tok.id}`
                        const expired = tok.expires_at && new Date(tok.expires_at) < new Date()
                        return (
                          <div key={tok.id} className={['flex items-center gap-3 text-[12px] rounded px-3 py-2', expired ? 'opacity-40' : 'bg-muted'].join(' ')}>
                            <span className="flex-1 truncate text-muted-foreground">{tok.label ?? url}</span>
                            {tok.expires_at && (
                              <span className="text-muted-foreground shrink-0">
                                {expired ? 'Expired' : `Exp. ${new Date(tok.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await navigator.clipboard.writeText(url)
                                setCopiedId(tok.id)
                                setTimeout(() => setCopiedId(null), 2000)
                              }}
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              {copiedId === tok.id ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {companies.length === 0 && (
          <Card className="px-6 py-12 text-center mb-10">
            <p className="text-[15px] font-semibold text-foreground mb-2">No companies added yet</p>
            <p className="text-[13px] text-muted-foreground mb-4">Add companies to create public intelligence pages and generate ungated demo links.</p>
          </Card>
        )}

        {/* B2B client finder */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-foreground mb-1">B2B prospect finder</h2>
            <p className="text-[13px] text-muted-foreground">Search companies in your pipeline as potential Starting Monday customers. Add them above to build a demo intelligence page.</p>
          </div>
          <form onSubmit={handleFinder} className="flex gap-3 mb-4">
            <Input
              value={finderQuery}
              onChange={e => setFinderQuery(e.target.value)}
              placeholder="Search by company name or sector..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={finding || !finderQuery.trim()}
              className="shrink-0"
            >
              {finding ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {finderResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {finderResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-3 py-2.5 bg-muted rounded-lg">
                  <div>
                    <span className="text-[14px] font-semibold text-foreground">{r.name}</span>
                    {r.industry && <span className="text-[12px] text-muted-foreground ml-2">{r.industry}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setSaving(true)
                      try {
                        const res = await fetch('/api/intelligence/companies', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ company_name: r.name, sector: r.industry || undefined }),
                        })
                        const data = await res.json()
                        if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
                        const entry: IntelCompany = {
                          slug: data.slug,
                          company_name: r.name,
                          sector: r.industry || null,
                          website: null,
                          is_featured: false,
                          signalCount: 0,
                          tokens: [],
                        }
                        setCompanies(c => [entry, ...c])
                        toast.success(`${r.name} added to intelligence.`)
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving || companies.some(c => c.company_name.toLowerCase() === r.name.toLowerCase())}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {companies.some(c => c.company_name.toLowerCase() === r.name.toLowerCase()) ? 'Added' : '+ Add to intel'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

      </main>
    </div>
  )
}

