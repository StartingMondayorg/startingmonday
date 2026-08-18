export type AppSubscriptionStatus =
  | 'paused'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'inactive'

// Maps a Stripe subscription status + pause_collection to the internal status
// stored in the users table. Extracted for testability.
export function mapStripeStatus(
  stripeStatus: string,
  pauseCollection?: { behavior: string } | null,
): AppSubscriptionStatus {
  if (pauseCollection?.behavior) return 'paused'
  switch (stripeStatus) {
    case 'active':   return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'canceled': return 'canceled'
    default:         return 'inactive'
  }
}
