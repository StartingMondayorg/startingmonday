export const CHANNELS = [
  'executives',
  'coaches',
  'outplacement',
  'search_firms',
] as const

export type Channel = (typeof CHANNELS)[number]

export const EVENT_NAMES = {
  channelEntryClicked: 'channel_entry_clicked',
  personaRouteSelected: 'persona_route_selected',
  trustBlockViewed: 'trust_block_viewed',
  trustBlockInteracted: 'trust_block_interacted',
  microProductBoundaryViewed: 'micro_product_boundary_viewed',
  shortlistSprintViewed: 'shortlist_sprint_viewed',
  shortlistSprintCtaClicked: 'shortlist_sprint_cta_clicked',
  shortlistSprintCheckoutStarted: 'shortlist_sprint_checkout_started',
  shortlistSprintPurchased: 'shortlist_sprint_purchased',
  shortlistSprintDelivered: 'shortlist_sprint_delivered',
  shortlistSprintCreditApplied: 'shortlist_sprint_credit_applied',
  partnerPilotAdminViewed: 'partner_pilot_admin_viewed',
  partnerPilotSeatStatusUpdated: 'partner_pilot_seat_status_updated',
} as const

export type ChannelEventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES]

export const HERO_EVENT_NAMES = {
  heroView: 'hero_view',
  getAccessClick: 'cta_get_access_click',
  exampleClick: 'cta_example_click',
  exampleView: 'example_page_view',
  exampleToAccessClick: 'example_to_access_click',
} as const

export type HeroEventName = (typeof HERO_EVENT_NAMES)[keyof typeof HERO_EVENT_NAMES]

export type ChannelEntryClickedProps = {
  channel: Channel
  cta_label: string
  source_page: string
  variant_key?: string
  session_id?: string
}

export type PersonaRouteSelectedProps = {
  channel: Channel
  persona: string
  source_route: string
  target_route: string
  variant_key?: string
  session_id?: string
}

export type TrustBlockViewedProps = {
  channel: Channel
  route: string
  block_id: string
  session_id?: string
}

export type TrustBlockInteractedProps = {
  channel: Channel
  route: string
  block_id: string
  action: string
  session_id?: string
}

export type MicroProductBoundaryViewedProps = {
  product_name: string
  route: string
  audience_type: string
  session_id?: string
}

export type ShortlistSprintViewedProps = {
  route: string
  audience_type: string
  offer_code: 'shortlist_sprint'
  session_id?: string
}

export type ShortlistSprintCtaClickedProps = {
  route: string
  cta_label: string
  destination: string
  offer_code: 'shortlist_sprint'
  session_id?: string
}

export type ShortlistSprintCheckoutStartedProps = {
  route: string
  offer_code: 'shortlist_sprint'
  amount_usd: number
  session_id?: string
}

export type PartnerPilotAdminViewedProps = {
  route: string
  partner_type: 'coach' | 'search' | 'outplacement' | 'mixed'
  session_id?: string
}

export type PartnerPilotSeatStatusUpdatedProps = {
  route: string
  seat_owner: string
  previous_status: string
  next_status: string
  action: 'mark_at_risk' | 'mark_active'
  session_id?: string
}
