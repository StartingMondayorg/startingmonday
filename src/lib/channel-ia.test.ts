import { describe, expect, it } from 'vitest'
import { CHANNEL_ROUTE_SPECS, EXECUTIVE_PERSONA_ROUTES } from './channel-ia'

describe('channel IA route specs', () => {
  it('keeps each acquisition channel on a canonical route', () => {
    expect(CHANNEL_ROUTE_SPECS).toHaveLength(4)
    expect(CHANNEL_ROUTE_SPECS.every((spec) => spec.route === spec.targetCanonicalRoute)).toBe(true)
    expect(EXECUTIVE_PERSONA_ROUTES.cio_cto_transition).toBe('/for-cio')
  })
})
