import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { slugify } from '@/lib/intelligence'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('intelligence_companies')
    .select('slug, company_name, description, sector, website, is_featured, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ companies: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    company_name: string
    description?: string
    sector?: string
    website?: string
    is_featured?: boolean
  }

  if (!body.company_name?.trim()) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
  }

  const slug = slugify(body.company_name.trim())
  const admin = createAdminClient()

  const { error } = await admin
    .from('intelligence_companies')
    .upsert(
      {
        slug,
        company_name: body.company_name.trim(),
        description: body.description ?? null,
        sector: body.sector ?? null,
        website: body.website ?? null,
        is_featured: body.is_featured ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slug })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
