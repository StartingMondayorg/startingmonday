import { getStripe } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the Stripe customer ID for a user. If it isn't stored in the DB,
 * looks it up in Stripe by email, saves it, and returns it. Returns null if
 * the user has no Stripe customer record at all.
 */
export async function getOrRecoverStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!user) return null
  if (user.stripe_customer_id) return user.stripe_customer_id

  // Not in DB -- search Stripe by email
  if (!user.email) return null
  const list = await getStripe().customers.list({ email: user.email, limit: 5 })
  if (!list.data.length) return null

  // Pick the most recently created customer and back-fill
  const customer = list.data.sort((a, b) => b.created - a.created)[0]
  await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', userId)

  return customer.id
}
