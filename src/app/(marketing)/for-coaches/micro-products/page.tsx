import type { Metadata } from 'next'
import Link from 'next/link'
import { CoachBundleCheckoutButton } from '@/components/micro-products/CoachBundleCheckoutButton'
import { CoachValueNudge } from '@/components/CoachValueNudge'
import { COACH_MICRO_PRODUCTS } from './product-data'

export const metadata: Metadata = {
  title: 'Coach Micro Products | Starting Monday',
  description:
    'Sellable, coach-first micro products built to improve between-session execution, readiness diagnostics, and governance communication quality.',
  alternates: { canonical: 'https://startingmonday.app/for-coaches/micro-products' },
}

const COACH_BUNDLE_PACKS = [
  {
    slug: 'bundle-1',
    name: '1-Product Quick Start Bundle',
    discount: '10% off',
    oneLiner: 'Choose any one coach micro product and get launch pricing.',
    notes: [
      'Best for one urgent coaching pain right now.',
      'Great first purchase before expanding your workflow.',
    ],
  },
  {
    slug: 'bundle-2',
    name: '2-Product Momentum Bundle',
    discount: '18% off',
    oneLiner: 'Choose any two products to solve one core pain plus one adjacent risk.',
    notes: [
      'Common pair: Anti-Drift Kit + Interview Debrief and Recovery Pack.',
      'Built for coaches who want visible improvement this month.',
    ],
  },
  {
    slug: 'bundle-3',
    name: '3-Product Operating Bundle',
    discount: '25% off',
    oneLiner: 'Choose any three products for a broader between-session operating upgrade.',
    notes: [
      'Common set: Anti-Drift Kit + Executive Proof Library Builder + Board and Stakeholder Update Writing Kit.',
      'Best value for coaches running multiple active clients.',
    ],
  },
] as const

export default function CoachMicroProductsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-coaches" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to coach preview
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <header className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">Coach micro product catalog</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Small products. Immediate coaching leverage.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-3xl mb-4">
            These are intentionally narrow, practical products for executive coaches. Each product solves one expensive workflow problem fast.
          </p>
        </header>

        <section className="mb-8">
          <CoachValueNudge
            eyebrow="Coach micro products"
            title="Each product should feel like a quick win, not another tool to manage."
            body="Browse the catalog, compare the bundles, and if the value feels immediate, jump back to the coach preview so the full workflow stays visible."
            sourcePage="/for-coaches/micro-products"
            secondaryHref="/for-coaches"
            secondaryLabel="Open the coach preview"
          />
        </section>

        <section id="bundle-packs" className="border border-emerald-200 rounded-2xl p-6 bg-emerald-50/40 mb-8">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-3">Bundle packs</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-3">Save more with 1-3 product bundles</h2>
          <p className="text-[14px] text-slate-700 leading-relaxed mb-5">
            Bundle discounts are applied automatically at checkout. You can also enter a discount code before launching checkout.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COACH_BUNDLE_PACKS.map((bundle) => (
              <article key={bundle.slug} className="rounded-2xl border border-emerald-200 bg-white p-5 flex flex-col">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-emerald-700 mb-2">{bundle.discount}</p>
                <h3 className="text-[18px] font-bold text-slate-900 mb-2 leading-snug">{bundle.name}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{bundle.oneLiner}</p>
                <div className="space-y-2 mb-4 flex-1">
                  {bundle.notes.map((note) => (
                    <p key={note} className="text-[12px] text-slate-600 leading-relaxed">
                      {note}
                    </p>
                  ))}
                </div>
                <CoachBundleCheckoutButton bundleSlug={bundle.slug} buttonLabel="Start bundle checkout" fallbackHref="/partners#apply" />
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COACH_MICRO_PRODUCTS.map((product) => (
            <article key={product.slug} className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col">
              <h2 className="text-[20px] font-bold text-slate-900 leading-snug mb-2">{product.name}</h2>
              <p className="text-[14px] text-slate-600 leading-relaxed mb-3">{product.oneLiner}</p>
              <p className="text-[17px] font-bold text-orange-600 mb-4">{product.price}</p>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-4 flex-1">{product.pain}</p>
              <Link
                href={`/for-coaches/micro-products/${product.slug}`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 text-white text-[13px] font-semibold px-4 py-2 hover:bg-slate-700 transition-colors"
              >
                View product and checkout copy
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <CoachValueNudge
            eyebrow="From catalog to decision"
            title="If a micro product solves the pain, the preview shows where it fits in the bigger coach workflow."
            body="That way the purchase is tied to a real coaching use case, not a one-off feature. Use the preview to decide whether you want the full operating layer too."
            sourcePage="/for-coaches/micro-products"
            secondaryHref="/for-coaches/trust-pack"
            secondaryLabel="Read the trust pack"
          />
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

