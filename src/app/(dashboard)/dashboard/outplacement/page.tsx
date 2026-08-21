import Link from 'next/link'
import { Button, Card } from '@/components/ui'
export default function OutplacementLanding() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center font-sans">
      <header className="dark text-foreground w-full bg-card py-4 mb-8">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
        </div>
      </header>
      <Card className="w-full max-w-2xl p-8 flex flex-col items-center shadow">
        <h1 className="text-3xl font-bold text-foreground mb-2">Outplacement by Starting Monday</h1>
        <p className="text-lg text-muted-foreground mb-6 text-center">
          Modern, executive-focused outplacement for high-performing leaders.<br />
          White-label, partner-branded, and ready to launch in days.
        </p>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { href: '/dashboard/outplacement/firm-admin', label: 'Firm admin view', desc: 'Compare by book and by cohort.' },
            { href: '/dashboard/outplacement/counselor', label: 'Counselor view', desc: 'What changed, what is stuck, what to do next.' },
            { href: '/dashboard/outplacement/enterprise', label: 'Enterprise view', desc: 'Sponsor-safe reporting and governance gates.' },
            { href: '/dashboard/outplacement/operator', label: 'Operator console', desc: 'Cohort health, exceptions, and interventions.' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="p-4 text-left hover:border-primary/30 transition-colors">
                <p className="text-[14px] font-semibold text-foreground">{item.label}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
        <ul className="text-muted-foreground text-base mb-8 space-y-2 list-disc list-inside">
          <li>1:1 executive coaching and job search strategy</li>
          <li>Personalized introductions to top executive recruiters</li>
          <li>AI-powered resume, LinkedIn, and interview prep</li>
          <li>Weekly progress tracking and reporting for HR/partners</li>
          <li>Seamless white-label experience for your brand</li>
        </ul>
        <Button render={<a href="mailto:outplacement@startingmonday.com" />} size="lg" className="text-lg px-8 py-3 h-auto mb-2">Request a Demo</Button>
        <p className="text-xs text-muted-foreground mt-4">For partners: Custom landing and onboarding available. Contact us to white-label for your firm.</p>
      </Card>
    </div>
  )
}

