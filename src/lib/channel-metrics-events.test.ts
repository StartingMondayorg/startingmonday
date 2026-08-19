import { describe, expect, it } from 'vitest'
import { HERO_EVENT_NAMES } from './channel-metrics-events'

describe('Starting Monday hero event vocabulary', () => {
  it('keeps the approved SM-only event names stable', () => {
    expect(Object.values(HERO_EVENT_NAMES)).toEqual([
      'hero_view',
      'cta_get_access_click',
      'cta_example_click',
      'example_page_view',
      'example_to_access_click',
    ])
  })
})

import { CHANNELS, EVENT_NAMES } from './channel-metrics-events'

describe('channel metrics taxonomy', () => {
  it('contains all supported acquisition channels and event keys', () => {
    expect(CHANNELS).toEqual(['executives', 'coaches', 'outplacement', 'search_firms'])
    expect(EVENT_NAMES.channelEntryClicked).toBe('channel_entry_clicked')
    expect(EVENT_NAMES.shortlistSprintPurchased).toBe('shortlist_sprint_purchased')
  })
})
