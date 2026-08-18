import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = PrepRouteParamsSchema.safeParse(await params)
  if (!routeParams.success) {
    return apiError(firstZodError(routeParams.error), 400)
  }
  const { id: companyId } = routeParams.data

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = await createClient()

  const [{ data: contact }, { data: signal }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('company_signals')
      .select('id')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .neq('signal_type', 'pattern_alert')
      .order('signal_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  await supabase.from('outreach_logs').insert({
    user_id: userId,
    company_id: companyId,
    contact_id: contact?.id ?? null,
    signal_id: signal?.id ?? null,
    channel: 'linkedin',
    webhook_payload: { email_source: 'prep_outreach_log_route' },
  })

  if (contact?.id) {
    await supabase
      .from('contacts')
      .update({ last_contact_date: new Date().toISOString().split('T')[0] })
      .eq('id', contact.id)
      .eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
