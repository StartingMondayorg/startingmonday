import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <Card id={id} className="bg-slate-900 rounded-lg p-6 mb-6 ring-0">
      <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">{eyebrow}</h2>
      <p className="text-[18px] font-bold text-white mb-3 leading-snug">{title}</p>
      <p className="text-[14px] text-slate-300 leading-relaxed mb-5">{body}</p>
      <p className="text-[13px] font-semibold text-slate-200 mb-4">{prompt}</p>
      <Button size="lg" render={<Link href={ctaHref} />}>
        {ctaLabel}
      </Button>
      <p className="text-[12px] text-slate-500 mt-4">{footer}</p>
    </Card>
  )
}
