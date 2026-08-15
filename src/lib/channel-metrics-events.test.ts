import { describe, expect, it } from 'vitest'
import { CHANNELS, EVENT_NAMES } from './channel-metrics-events'

describe('channel metrics taxonomy', () => {
  it('contains all supported acquisition channels and event keys', () => {
    expect(CHANNELS).toEqual(['executives', 'coaches', 'outplacement', 'search_firms'])
    expect(EVENT_NAMES.channelEntryClicked).toBe('channel_entry_clicked')
    expect(EVENT_NAMES.shortlistSprintPurchased).toBe('shortlist_sprint_purchased')
  })
})
