import { describe, expect, it } from 'vitest'
import {
  applyAttributionV2,
  buildPrepClaimProvenance,
  validatePrepClaimProvenance,
  type PrepClaimProvenance,
} from '@/lib/prep/prep-provenance'

describe('prep provenance', () => {
  it('builds provenance records with origin classes', () => {
    const brief = [
      '## Bottom Line',
      'Candidate has a verified track record of scaling platform teams.',
      '## The Situation',
      '- Recent company signals indicate governance pressure from the board.',
    ].join('\n')

    const claims = buildPrepClaimProvenance(brief)
    expect(claims.length).toBeGreaterThan(0)
    expect(claims.every((claim) => !!claim.originClass)).toBe(true)
    expect(claims.every((claim) => Array.isArray(claim.sourceEvidence))).toBe(true)
  })

  it('blocks sensitive inferred claims', () => {
    const claims: PrepClaimProvenance[] = [
      {
        claimText: 'Compensation should be at $450K base with significant equity upside.',
        originClass: 'inferred',
        section: 'Offer',
        sensitivePolicyHooks: ['compensation_claim'],
        sourceEvidence: [],
      },
    ]

    const errors = validatePrepClaimProvenance(claims)
    expect(errors.some((e) => e.code === 'sensitive_inferred_block')).toBe(true)
  })

  it('flags invalid origin classes', () => {
    const claims = [
      {
        claimText: 'A claim without a valid origin class.',
        originClass: 'unknown_class',
        section: 'Bottom Line',
        sensitivePolicyHooks: [],
        sourceEvidence: [],
      },
    ] as unknown as PrepClaimProvenance[]

    const errors = validatePrepClaimProvenance(claims)
    expect(errors.some((e) => e.code === 'invalid_origin_class')).toBe(true)
  })

  it('blocks sensitive user/system claims without matching source evidence', () => {
    const claims: PrepClaimProvenance[] = [
      {
        claimText: 'Compensation package expectation should stay above market median.',
        originClass: 'system_detected',
        section: 'Offer',
        sensitivePolicyHooks: ['compensation_claim'],
        sourceEvidence: ['career_history'],
      },
    ]

    const errors = validatePrepClaimProvenance(claims)
    expect(errors.some((e) => e.code === 'sensitive_requires_evidence')).toBe(true)
  })

  it('downgrades claims to inferred when attribution context ids do not match', () => {
    const claims: PrepClaimProvenance[] = [
      {
        claimText: 'Claim linked to missing context id.',
        originClass: 'system_detected',
        section: 'Bottom Line',
        sensitivePolicyHooks: [],
        sourceEvidence: ['company_signals'],
        sourceContextIds: ['ctx_missing'],
      },
    ]

    const normalized = applyAttributionV2(claims, ['ctx_available'])
    expect(normalized[0]?.originClass).toBe('inferred')
    expect(normalized[0]?.sourceEvidence).toEqual([])
    expect(normalized[0]?.sourceContextIds).toEqual([])
  })

  it('keeps claims grounded when attribution context ids match', () => {
    const claims: PrepClaimProvenance[] = [
      {
        claimText: 'Claim linked to available context id.',
        originClass: 'system_detected',
        section: 'Bottom Line',
        sensitivePolicyHooks: [],
        sourceEvidence: ['company_signals'],
        sourceContextIds: ['ctx_available', 'ctx_other'],
      },
    ]

    const normalized = applyAttributionV2(claims, ['ctx_available'])
    expect(normalized[0]?.originClass).toBe('system_detected')
    expect(normalized[0]?.sourceContextIds).toEqual(['ctx_available'])
  })
})
