'use client'

/**
 * ExecutiveBrandingProfile.tsx
 *
 * Sprint ITS-3: Reusable executive branding profile artifact.
 *
 * AC:
 * - Narrative thesis captured and maintained
 * - Leadership proof points listed
 * - Audience-specific message variants (CEO, board, CHRO, peer)
 * - Subtle external positioning guidance per lifecycle state
 */

import { useState } from 'react'
import type { ExecutiveLifecycleState, ExecutivePersonaVariant } from '@/lib/executive-lifecycle'
import { LIFECYCLE_TEMPLATES } from '@/lib/executive-lifecycle'

interface AudienceVariant {
  audience: string
  headline: string
  keyMessage: string
  avoidLanguage: string
}

interface BrandingProfileData {
  narrativeThesis: string        // Legacy → Inflection → Next mandate
  legacyStatement: string        // What I built / fixed
  inflectionStatement: string    // Why now
  nextMandateStatement: string   // Where my edge is strongest
  leadershipProofPoints: string[]
  audienceVariants: AudienceVariant[]
  lastUpdatedAt?: string
}

interface ExecutiveBrandingProfileProps {
  data?: Partial<BrandingProfileData>
  lifecycleState: ExecutiveLifecycleState
  personaVariant: ExecutivePersonaVariant
  onSave?: (data: BrandingProfileData) => void
  readOnly?: boolean
}

const DEFAULT_AUDIENCE_VARIANTS: AudienceVariant[] = [
  { audience: 'CEO', headline: '', keyMessage: '', avoidLanguage: '' },
  { audience: 'Board', headline: '', keyMessage: '', avoidLanguage: '' },
  { audience: 'CHRO', headline: '', keyMessage: '', avoidLanguage: '' },
  { audience: 'Peer / Recruiter', headline: '', keyMessage: '', avoidLanguage: '' },
]

export function ExecutiveBrandingProfile({
  data = {},
  lifecycleState,
  personaVariant,
  onSave,
  readOnly = false,
}: ExecutiveBrandingProfileProps) {
  const template = LIFECYCLE_TEMPLATES.find(
    (t) => t.state === lifecycleState && t.persona === personaVariant,
  ) ?? LIFECYCLE_TEMPLATES[0]

  const [narrativeThesis, setNarrativeThesis] = useState(data.narrativeThesis ?? '')
  const [legacy, setLegacy] = useState(data.legacyStatement ?? '')
  const [inflection, setInflection] = useState(data.inflectionStatement ?? '')
  const [nextMandate, setNextMandate] = useState(data.nextMandateStatement ?? '')
  const [proofPoints, setProofPoints] = useState<string[]>(data.leadershipProofPoints ?? ['', '', ''])
  const [variants, setVariants] = useState<AudienceVariant[]>(
    data.audienceVariants?.length ? data.audienceVariants : DEFAULT_AUDIENCE_VARIANTS,
  )

  function updateVariant(index: number, field: keyof AudienceVariant, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  function updateProofPoint(index: number, value: string) {
    setProofPoints((prev) => prev.map((p, i) => (i === index ? value : p)))
  }

  function handleSave() {
    onSave?.({
      narrativeThesis,
      legacyStatement: legacy,
      inflectionStatement: inflection,
      nextMandateStatement: nextMandate,
      leadershipProofPoints: proofPoints.filter(Boolean),
      audienceVariants: variants,
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Positioning guidance for this lifecycle state */}
      {template.positioningGuidance && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 px-5 py-4">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-blue-600 mb-1">
            Positioning guidance - {LIFECYCLE_TEMPLATES.find((t) => t.state === lifecycleState)?.state.replace('_', ' ')}
          </p>
          <p className="text-[13px] text-blue-800 leading-relaxed">{template.positioningGuidance}</p>
        </div>
      )}

      {/* Confidentiality notice for in-role users */}
      {lifecycleState === 'optionality' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 px-5 py-4">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-amber-600 mb-1">
            Confidentiality - subtle external positioning
          </p>
          <p className="text-[13px] text-amber-800 leading-relaxed">
            {template.confidentialityNotes}
          </p>
        </div>
      )}

      {/* Narrative architecture: 3 layers */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-[13px] font-bold text-slate-800">Narrative architecture</h3>
        <p className="text-[12px] text-slate-500">Three-layer story: what you built, why now, where your edge is strongest next.</p>
        {[
          { label: '1. Legacy - what I built or fixed', value: legacy, setter: setLegacy, placeholder: 'e.g. Inherited a fragmented engineering org, consolidated to one platform, reduced TTM by 40%.' },
          { label: '2. Inflection - why now', value: inflection, setter: setInflection, placeholder: 'e.g. The company has been acquired. The scope I built now fits a larger stage.' },
          { label: '3. Next mandate - where my edge is strongest', value: nextMandate, setter: setNextMandate, placeholder: 'e.g. PE-backed platforms scaling from $50M to $200M where the operating complexity is highest.' },
        ].map(({ label, value, setter, placeholder }) => (
          <div key={label}>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</label>
            <textarea
              value={value}
              onChange={(e) => setter(e.target.value)}
              rows={2}
              disabled={readOnly}
              placeholder={placeholder}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-orange-400 resize-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Master thesis (one-sentence synthesis)</label>
          <textarea
            value={narrativeThesis}
            onChange={(e) => setNarrativeThesis(e.target.value)}
            rows={2}
            disabled={readOnly}
            placeholder="e.g. I build operating platforms in high-complexity PE transitions and am ready for my next CTO mandate."
            className="w-full border border-orange-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-orange-500 resize-none bg-orange-50/20 disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* Leadership proof points */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-[13px] font-bold text-slate-800">Leadership proof points</h3>
        <p className="text-[12px] text-slate-500">Specific, quantified outcomes you can cite in any audience context.</p>
        {proofPoints.map((point, index) => (
          <div key={index}>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Proof point {index + 1}</label>
            <input
              value={point}
              onChange={(e) => updateProofPoint(index, e.target.value)}
              disabled={readOnly}
              placeholder="e.g. Reduced engineering headcount by 18% while increasing delivery velocity 2x over 18 months."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-orange-400 disabled:bg-slate-50"
            />
          </div>
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setProofPoints((prev) => [...prev, ''])}
            className="text-[12px] text-orange-600 hover:text-orange-700 font-semibold"
          >
            + Add proof point
          </button>
        )}
      </div>

      {/* Audience-specific variants */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-[13px] font-bold text-slate-800">Audience-specific message variants</h3>
        <p className="text-[12px] text-slate-500">Different stakeholders need different angles on the same story.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {variants.map((variant, index) => (
            <div key={variant.audience} className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{variant.audience}</p>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Headline for this audience</label>
                <input
                  value={variant.headline}
                  onChange={(e) => updateVariant(index, 'headline', e.target.value)}
                  disabled={readOnly}
                  placeholder="The core value claim for this stakeholder"
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-orange-400 disabled:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Key message</label>
                <input
                  value={variant.keyMessage}
                  onChange={(e) => updateVariant(index, 'keyMessage', e.target.value)}
                  disabled={readOnly}
                  placeholder="What they most need to hear"
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-orange-400 disabled:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Avoid with this audience</label>
                <input
                  value={variant.avoidLanguage}
                  onChange={(e) => updateVariant(index, 'avoidLanguage', e.target.value)}
                  disabled={readOnly}
                  placeholder="Language or framing that creates friction"
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-orange-400 disabled:bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={handleSave}
          className="bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[13px] px-5 py-2.5 rounded-lg transition-colors"
        >
          Save branding profile
        </button>
      )}

      {data.lastUpdatedAt && (
        <p className="text-[11px] text-slate-400">
          Last updated: {new Date(data.lastUpdatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
