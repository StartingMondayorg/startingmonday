import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { formatMicroProductPrice, getMicroProductsForChannel, type MicroProductChannel } from '@/lib/micro-products'

type Props = {
  channel: MicroProductChannel
  sourceRoute: string
}

export function ChannelMicroProductRail({ channel, sourceRoute }: Props) {
  const products = getMicroProductsForChannel(channel)
  if (products.length === 0) return null

  return (
    <section className="rounded border border-slate-800 bg-slate-900 p-4 sm:p-5 mb-8">
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Micro-products for this channel</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.slice(0, 2).map((product) => (
          <TrackLink
            key={product.slug}
            href={product.ctaHref}
            rel={product.ctaHref.startsWith('/settings/') ? 'nofollow' : undefined}
            event={EVENT_NAMES.microProductBoundaryViewed}
            logToUserEvents
            properties={{
              product_name: product.name,
              route: sourceRoute,
              audience_type: product.audienceType,
              channel,
              product_slug: product.slug,
            }}
            className="block rounded border border-slate-800 bg-slate-950 p-4 hover:border-orange-500 transition-colors"
          >
            <p className="text-[13px] font-semibold text-white mb-1">{product.name}</p>
            <p className="text-[12px] text-slate-300 leading-relaxed mb-2">{product.summary}</p>
            <p className="text-[12px] font-semibold text-orange-300">{formatMicroProductPrice(product.amountCents, product.defaultInterval)}</p>
          </TrackLink>
        ))}
      </div>
    </section>
  )
}
