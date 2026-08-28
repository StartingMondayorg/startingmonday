import Link from 'next/link'
import { Button, Card } from '@/components/ui'
type DashboardPathWelcomeCardProps = {
  id: string
  eyebrow: string
  title: string
  body: string
  prompt: string
  ctaHref: string
  ctaLabel: string
  footer: string
}

export function DashboardPathWelcomeCard({
  id,
  eyebrow,
  title,
  body,
  prompt,
  ctaHref,
  ctaLabel,
  footer,
}: DashboardPathWelcomeCardProps) {
  return (
    <Card id={id} className="bg-card rounded-lg p-6 mb-6 ring-0">
      <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">{eyebrow}</h2>
      <p className="text-[18px] font-bold text-foreground mb-3 leading-snug">{title}</p>
      <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">{body}</p>
      <p className="text-[13px] font-semibold text-foreground mb-4">{prompt}</p>
      <Button size="lg" render={<Link href={ctaHref} />}>
        {ctaLabel}
      </Button>
      <p className="text-[12px] text-muted-foreground mt-4">{footer}</p>
    </Card>
  )
}
