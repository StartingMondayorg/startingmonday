/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { requireAuth } from '@/lib/require-auth'

const ENRICHMENT_API_URL = 'https://api.clearbit.com/v2/companies/find'
const ENRICHMENT_API_KEY = process.env.CLEARBIT_API_KEY

export async function POST(request: NextRequest) {
  const sessionAuth = await requireAuth(request)
  if (!sessionAuth.ok) return sessionAuth.response
  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response
  if (!ENRICHMENT_API_KEY) {
    return NextResponse.json({ error: 'Enrichment API key not configured' }, { status: 500 })
  }

  const admin = createAdminClient() as any

  const { data: contactsRaw, error: fetchError } = await admin
    .from('contacts')
    .select('id, firm')
    .is('enriched', false);

  const contacts = Array.isArray(contactsRaw) ? contactsRaw : []

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  for (const contact of contacts) {
    try {
      const firm = (contact?.firm ?? '').toString().trim()
      if (!firm) continue

      const response = await fetch(`${ENRICHMENT_API_URL}?domain=${encodeURIComponent(firm)}`, {
        headers: {
          Authorization: `Bearer ${ENRICHMENT_API_KEY}`,
        },
      })

      if (!response.ok) {
        console.error(`Failed to enrich contact ${contact.id}: ${response.statusText}`)
        continue
      }

      const enrichmentData = await response.json()

      const { error: updateError } = await admin
        .from('contacts')
        .update({
          enriched: true,
          enrichment_data: enrichmentData,
        })
        .eq('id', contact.id)

      if (updateError) {
        console.error(`Failed to update contact ${contact.id}: ${updateError.message}`)
      }
    } catch (err) {
      console.error(`Error enriching contact ${contact.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, enriched: contacts.length })
}