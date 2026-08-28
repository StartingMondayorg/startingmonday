import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OfferSynthesis } from './offer-synthesis'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'Offers - Starting Monday' }

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

type OfferCompany = {
  id: string
  name: string
  sector: string | null
  fit_score: number | null
  offer_role_title: string | null
  offer_base: number | null
  offer_bonus_pct: number | null
  offer_signing: number | null
  offer_equity: string | null
  offer_notes: string | null
  offer_decision_factors: string | null
}

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await supabase
    .from('companies')
    .select('id, name, sector, fit_score, offer_role_title, offer_base, offer_bonus_pct, offer_signing, offer_equity, offer_notes, offer_decision_factors')
    .eq('user_id', user.id)
    .eq('stage', 'offer')
    .is('archived_at', null)
    .order('fit_score', { ascending: false, nullsFirst: false })

  const offers = (raw ?? []) as unknown as OfferCompany[]

  const ROWS = [
    { label: 'Role',         render: (o: OfferCompany) => o.offer_role_title ?? <span className="text-muted-foreground">-</span> },
    { label: 'Base',         render: (o: OfferCompany) => o.offer_base ? fmt(o.offer_base) : <span className="text-muted-foreground">-</span> },
    { label: 'Bonus',        render: (o: OfferCompany) => {
      if (!o.offer_bonus_pct) return <span className="text-muted-foreground">-</span>
      const est = o.offer_base ? ` (${fmt(Math.round(o.offer_base * o.offer_bonus_pct / 100))})` : ''
      return `${o.offer_bonus_pct}%${est}`
    }},
    { label: 'Signing',      render: (o: OfferCompany) => o.offer_signing ? fmt(o.offer_signing) : <span className="text-muted-foreground">-</span> },
    { label: 'Equity',       render: (o: OfferCompany) => o.offer_equity ?? <span className="text-muted-foreground">-</span> },
    { label: 'Total cash',   render: (o: OfferCompany) => {
      if (!o.offer_base) return <span className="text-muted-foreground">-</span>
      const bonus = o.offer_bonus_pct ? Math.round(o.offer_base * o.offer_bonus_pct / 100) : 0
      return <span className="font-bold text-success">{fmt(o.offer_base + bonus)}</span>
    }},
    { label: 'Fit score',    render: (o: OfferCompany) => o.fit_score != null ? o.fit_score : <span className="text-muted-foreground">-</span> },
    { label: 'Notes',        render: (o: OfferCompany) => o.offer_notes
      ? <span className="text-[13px] text-muted-foreground leading-relaxed">{o.offer_notes}</span>
      : <span className="text-muted-foreground">-</span>
    },
    { label: 'Factors',      render: (o: OfferCompany) => o.offer_decision_factors
      ? <span className="text-[13px] text-muted-foreground leading-relaxed">{o.offer_decision_factors}</span>
      : <span className="text-muted-foreground">-</span>
    },
  ]

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Offers in Flight</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            {offers.length === 0
              ? 'No offers yet. Move a company to the Offer stage to start tracking.'
              : `${offers.length} offer${offers.length !== 1 ? 's' : ''} - compare compensation, fit, and negotiate.`}
          </p>
        </div>

        {offers.length === 0 ? (
          <Card className="p-16 text-center">
            <p className="text-[14px] text-muted-foreground mb-4">No companies at the Offer stage.</p>
            <Button variant="secondary" render={<Link href="/dashboard/briefing" />}>
              Open daily briefing →
            </Button>
          </Card>
        ) : offers.length === 1 ? (
          // Single offer: vertical card layout
          <Card className="border-success/30 py-0 overflow-hidden">
            <div className="px-6 py-[18px] border-b border-success/30 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-foreground">{offers[0].name}</h2>
                {offers[0].sector && <p className="text-[13px] text-muted-foreground mt-0.5">{offers[0].sector}</p>}
              </div>
              <div className="flex items-center gap-3">
                {offers[0].offer_role_title && (
                  <Button
                    variant="secondary"
                    className="text-success bg-success/10"
                    render={<a href={`/dashboard/salary?company=${encodeURIComponent(offers[0].name)}&role=${encodeURIComponent(offers[0].offer_role_title)}`} />}
                  >
                    Get negotiation script →
                  </Button>
                )}
                <Button variant="outline" render={<Link href={`/dashboard/companies/${offers[0].id}`} />}>
                  View company →
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {ROWS.map(row => {
                const val = row.render(offers[0])
                return (
                  <div key={row.label} className="px-6 py-4 flex items-start gap-6">
                    <span className="text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground w-24 shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-[14px] text-foreground flex-1">{val}</span>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-5 border-t border-border bg-muted">
              <p className="text-[13px] text-muted-foreground">
                Add offer details on the{' '}
                <Link href={`/dashboard/companies/${offers[0].id}`} className="text-muted-foreground underline hover:text-foreground">
                  company page
                </Link>
                {' '}to unlock total cash calculation and the negotiation script.
              </p>
            </div>
          </Card>
        ) : (
          // Multiple offers: comparison table
          <Card className="border-success/30 py-0 overflow-hidden">
            <div className="px-6 py-[18px] border-b border-success/30">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-success">Side-by-side comparison</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead scope="col" className="py-3 pl-6 pr-4 text-left text-[13px] font-bold tracking-[0.09em] uppercase text-muted-foreground w-28">
                      Field
                    </TableHead>
                    {offers.map(o => (
                      <TableHead key={o.id} className="py-3 px-4 text-left">
                        <Link href={`/dashboard/companies/${o.id}`} className="text-[14px] font-bold text-foreground hover:text-muted-foreground block">
                          {o.name}
                        </Link>
                        {o.sector && <p className="text-[13px] text-muted-foreground font-normal mt-0.5">{o.sector}</p>}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.map(row => (
                    <TableRow key={row.label} className="border-b border-border">
                      <TableCell className="py-3.5 pl-6 pr-4 text-[13px] font-bold tracking-[0.07em] uppercase text-muted-foreground align-top">
                        {row.label}
                      </TableCell>
                      {offers.map(o => (
                        <TableCell key={o.id} className="py-3.5 px-4 text-[14px] text-foreground align-top">
                          {row.render(o)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="py-4 pl-6 pr-4" />
                    {offers.map(o => (
                      <TableCell key={o.id} className="py-4 px-4">
                        <div className="flex flex-col gap-2">
                          {o.offer_role_title && (
                            <Button
                              variant="secondary"
                              className="text-success bg-success/10 inline-block"
                              render={<a href={`/dashboard/salary?company=${encodeURIComponent(o.name)}&role=${encodeURIComponent(o.offer_role_title)}`} />}
                            >
                              Negotiate →
                            </Button>
                          )}
                          <Button variant="outline" className="inline-block" render={<Link href={`/dashboard/companies/${o.id}`} />}>
                            Details →
                          </Button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {offers.length > 0 && <OfferSynthesis offers={offers} />}
      </main>
    </div>
  )
}

