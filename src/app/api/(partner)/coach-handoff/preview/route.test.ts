import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('coach handoff preview route', () => {
  it('returns 400 when body is not valid json', async () => {
    const req = new NextRequest('https://startingmonday.app/api/coach-handoff/preview', {
      method: 'POST',
      body: '{',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('maps valid handoff payload to onboarding preview fields', async () => {
    const req = new NextRequest('https://startingmonday.app/api/coach-handoff/preview', {
      method: 'POST',
      body: JSON.stringify({
        idealLifeVision: 'Build a sustainable leadership career with room for family and long-term impact.',
        careerVisionStatement: 'Lead strategic commercial growth in foodservice systems.',
        nextRoleCriteria: ['Strategic accounts', 'Hybrid work', 'Clear 90-day mandate'],
        industries: ['Commercial foodservice equipment', 'Hospitality operations tech'],
        companies: ['Alto-Shaam', 'Rational'],
      }),
    })

    const res = await POST(req)
    const body = await res.json() as {
      ok: boolean
      preview: {
        positioningSummary: string
        targetSectors: string[]
        targetCompanies: string[]
        roleCriteria: string[]
      }
    }

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.preview.positioningSummary).toContain('Lead strategic commercial growth')
    expect(body.preview.targetSectors).toEqual(['Commercial foodservice equipment', 'Hospitality operations tech'])
    expect(body.preview.targetCompanies).toEqual(['Alto-Shaam', 'Rational'])
    expect(body.preview.roleCriteria).toEqual(['Strategic accounts', 'Hybrid work', 'Clear 90-day mandate'])
  })

  it('returns 400 when no usable handoff fields are present', async () => {
    const req = new NextRequest('https://startingmonday.app/api/coach-handoff/preview', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 413 when payload exceeds body size limit', async () => {
    const oversized = 'x'.repeat(70 * 1024)
    const req = new NextRequest('https://startingmonday.app/api/coach-handoff/preview', {
      method: 'POST',
      body: JSON.stringify({
        careerVisionStatement: oversized,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(413)
  })
})
