import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Button, Card } from '@/components/ui'
export const metadata = { title: 'QA - Admin' }

export default async function AdminQaLandingPage() {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const staff = await getStaffMember(user.email ?? '')
	if (!hasAdminHeaderAccess(staff)) notFound()

	return (
		<div className={ADMIN_DARK_PAGE_BG}>
			<header className="border-b border-border bg-background/60 backdrop-blur-xl">
				<div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
					<span className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground sm:text-[14px]">
						<span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
					</span>
					<div className="flex items-center gap-4">
						<Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
							Admin
						</Link>
						<Link href="/dashboard/admin/onboarding/qa" className="text-[13px] font-semibold text-primary transition-colors">
							Onboarding QA
						</Link>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
				<Card variant="glass" className="p-5 mb-6">
					<h1 className="text-[26px] font-bold leading-tight text-foreground">Admin QA</h1>
					<p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
						QA operations are consolidated in the onboarding scorecard and automation reporting surfaces.
					</p>
					<div className="mt-5 flex flex-wrap gap-3">
						<Button render={<Link href="/dashboard/admin/onboarding/qa" />}>
							Open Onboarding QA Scorecard
						</Button>
						<Button variant="outline" render={<Link href="/dashboard/admin/metrics" />}>
							Open Metrics
						</Button>
					</div>
				</Card>
			</main>
		</div>
	)
}