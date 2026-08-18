import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CoachValueNudge } from '@/components/CoachValueNudge'
import { CoachDeliverablePreviewTabs } from '@/components/micro-products/CoachDeliverablePreviewTabs'
import { MicroProductCheckoutButton } from '@/components/micro-products/MicroProductCheckoutButton'
import { COACH_MICRO_PRODUCTS, getCoachMicroProduct } from '../product-data'

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const product = getCoachMicroProduct(slug)

  if (!product) {
    return {
      title: 'Coach Micro Product | Starting Monday',
      description: 'Coach micro product detail page.',
    }
  }

  return {
    title: `${product.name} | Starting Monday`,
    description: product.oneLiner,
    alternates: {
      canonical: `https://startingmonday.app/for-coaches/micro-products/${product.slug}`,
    },
  }
}

export async function generateStaticParams() {
  return COACH_MICRO_PRODUCTS.map((product) => ({ slug: product.slug }))
}

export default async function CoachMicroProductDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = getCoachMicroProduct(slug)
  if (!product) notFound()

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-coaches/micro-products" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to catalog
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <header className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">Coach micro product</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-3">{product.name}</h1>
          <p className="text-[16px] font-semibold text-orange-600 mb-3">{product.price}</p>
          <p className="text-[15px] text-slate-600 leading-relaxed mb-2">{product.oneLiner}</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">Who this is for: {product.whoItsFor}</p>
        </header>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white mb-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">The painful problem</h2>
          <p className="text-[14px] text-slate-700 leading-relaxed">{product.pain}</p>
        </section>

        <section className="border border-emerald-200 rounded-2xl p-6 bg-emerald-50/40 mb-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Outcome promise</h2>
          <p className="text-[14px] text-slate-700 leading-relaxed">{product.promise}</p>
        </section>

        <section className="mb-6">
          <CoachValueNudge
            eyebrow="Before checkout"
            title="Use the product as a proof point, then decide whether the coach preview should be your next stop."
            body="This page is for a single purchase decision. The preview is where you see the broader coach workflow and determine whether the full platform adds enough value."
            sourcePage={`/for-coaches/micro-products/${product.slug}`}
            secondaryHref="/for-coaches"
            secondaryLabel="Open the coach preview"
          />
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white mb-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-3">What you get immediately</h2>
          <CoachDeliverablePreviewTabs deliverables={product.deliverables} />
        </section>

        <section className="border border-orange-200 rounded-2xl p-6 bg-orange-50/40 mb-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-3">Checkout copy</h2>
          <p className="text-[14px] text-slate-700 leading-relaxed mb-3">{product.checkoutCopy.headline}</p>
          <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700 leading-relaxed mb-3">
            {product.checkoutCopy.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">{product.checkoutCopy.guarantee}</p>
        </section>

        <section className="border border-emerald-200 rounded-2xl p-6 bg-emerald-50/40 mb-6">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-2">{product.appBridge.eyebrow}</p>
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">{product.appBridge.headline}</h2>
          <p className="text-[14px] text-slate-700 leading-relaxed mb-4">{product.appBridge.body}</p>
          <Link
            href={product.appBridge.ctaHref}
            className="inline-flex items-center rounded-lg border border-emerald-300 bg-white text-emerald-800 text-[13px] font-semibold px-4 py-2 hover:bg-emerald-100/60 transition-colors"
          >
            {product.appBridge.cta}
          </Link>
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">Buy now</p>
          <h2 className="text-[20px] font-bold text-slate-900 mb-2">Start checkout</h2>
          <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
            Get immediate access to this product at checkout. If you run into an issue, use the alternate link below and we will help you complete the order.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <MicroProductCheckoutButton slug={product.slug} label={`Buy ${product.name}`} fallbackHref="/partners#apply" />
            <Link href="/partners#apply" className="inline-flex items-center rounded-lg border border-slate-300 text-slate-700 text-[13px] font-semibold px-4 py-2 hover:bg-slate-50 transition-colors">
              Get purchase help
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <CoachValueNudge
            eyebrow="Prefer the full coach journey?"
            title="If this one product is useful, the full preview shows how the rest of the coaching flow connects."
            body="That makes the sign-up decision feel grounded in actual workflow value, not just a single feature purchase."
            sourcePage={`/for-coaches/micro-products/${product.slug}`}
            secondaryHref="/for-coaches/trust-pack"
            secondaryLabel="Read the trust pack"
          />
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

