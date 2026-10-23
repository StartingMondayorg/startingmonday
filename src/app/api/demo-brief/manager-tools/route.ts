import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { POST as executiveBriefPost } from '../executive-brief/route'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'

export async function POST(request: NextRequest) {
	if (request.nextUrl.searchParams.get('monitor') === '1') {
		return NextResponse.json({ ok: true, mode: 'monitor' }, { status: 202 })
	}

	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const staff = await getStaffMember(user)
	if (!hasAdminHeaderAccess(staff)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	try {
		return await executiveBriefPost(request)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'demo-brief/manager-tools' } })
		return NextResponse.json({ error: 'Failed to generate manager-tools brief.' }, { status: 500 })
	}
}
