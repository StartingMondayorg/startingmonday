import Link from 'next/link'
import { RoiCalculatorClient } from './roi-calculator-client'

export const metadata = {
  title: 'ROI Calculator by Channel and Role | Starting Monday',
  description: 'Directional ROI calculator for buyers comparing placement-speed, counselor-efficiency, and risk-reduction outcomes by channel and stakeholder role.',
}

export default function RoiCalculatorPage() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-4 text-[12px]">
            <Link href="/for-outplacement/economics" className="text-slate-200 hover:text-slate-200 transition-colors">Outplacement economics</Link>
            <Link href="/for-outplacement/trust-pack" className="text-slate-200 hover:text-slate-200 transition-colors">Trust pack</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-slate-900">ROI Calculator by Channel and Role</h1>
          <p className="text-[13px] text-slate-600 mt-1.5 max-w-3xl">
            Use this model in procurement and sponsor conversations to estimate directional value from placement-cycle acceleration,
            counselor efficiency gains, and reduced miss-risk.
          </p>
        </div>

        <RoiCalculatorClient />

        <section className="mt-6 bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 mb-2">Method note</p>
          <p className="text-[12px] text-slate-600 leading-relaxed">
            This calculator is a planning model, not a guarantee. Validate assumptions with observed cohort performance and attach final values
            to your board-safe claims policy before external reporting.
          </p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

