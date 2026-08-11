import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { readOutreachCsv, type CsvRow } from '@/app/(dashboard)/dashboard/outreach/outreach-data'

type ProviderFileSummary = {
	fileName: string
	label: string
	rowCount: number
	rows: CsvRow[]
	error: string | null
}

export const metadata: Metadata = {
	title: 'Mauricio Provider Read Access - Starting Monday',
	description: 'Read-only view of legacy provider outreach files for Mauricio.',
	robots: { index: false, follow: false },
	alternates: { canonical: 'https://startingmonday.app/mauricio-kickoff-execution/provider-read-access' },
}

async function readProviderFile(fileName: string, label: string): Promise<ProviderFileSummary> {
	try {
		const parsed = await readOutreachCsv(fileName)
		return {
			fileName,
			label,
			rowCount: parsed.rowCount,
			rows: parsed.rows,
			error: null,
		}
	} catch (error) {
		return {
			fileName,
			label,
			rowCount: 0,
			rows: [],
			error: error instanceof Error ? error.message : 'Unable to read file',
		}
	}
}

function previewValue(row: CsvRow, keys: string[]): string {
	for (const key of keys) {
		const value = row[key]?.trim()
		if (value) return value
	}
	return '\u2014'
}

export default async function MauricioProviderReadAccessPage() {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const staff = await getStaffMember(user.email ?? '')
	if (!staff) notFound()

	const [sendReady, followups, targetSlate] = await Promise.all([
		readProviderFile('provider_priority_send_ready.csv', 'Provider send-ready priority file'),
		readProviderFile('provider_priority_followups.csv', 'Provider follow-ups priority file'),
		readProviderFile('us-senior-executive-target-slate.csv', 'US senior executive target slate'),
	])

	const totalRows = sendReady.rowCount + followups.rowCount + targetSlate.rowCount

	return (
		<div className="min-h-screen bg-slate-100 font-sans">
			<nav className="bg-slate-900 border-b border-slate-800">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
					<Link href="/" className="text-[13px] font-bold tracking-[0.18em] uppercase">
						<span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
					</Link>
					<Link href="/mauricio-kickoff-execution" className="text-[13px] text-slate-300 hover:text-white">
						Back to Mauricio workspace
					</Link>
				</div>
			</nav>

			<main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
				<header className="bg-white border border-slate-200 rounded-xl p-5">
					<p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-700 mb-2">Read-only data view</p>
					<h1 className="text-[24px] font-bold text-slate-900 mb-2">Provider files access and contents</h1>
					<p className="text-[13px] text-slate-600 max-w-4xl">
						This page shows what legacy provider files are currently available, how many rows each file contains,
						and a quick preview Mauricio can use for QA.
					</p>
					<p className="mt-3 text-[13px] text-slate-600">
						Confidential operations data only. Target handoff outcome: founder follow-up within 24 hours on warm leads.
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<Link
							href="/mauricio-kickoff-execution/customer-email-by-channel"
							className="inline-flex items-center rounded border border-slate-300 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-800 hover:bg-slate-100"
						>
							Open customer email by channel viewer
						</Link>
						<Link
							href="/mauricio-kickoff-execution"
							className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
						>
							Start weekly review from workspace
						</Link>
					</div>
				</header>

				<section className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<div className="bg-white border border-slate-200 rounded-lg p-4">
						<p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Files tracked</p>
						<p className="text-[24px] font-bold text-slate-900 mt-1">3</p>
					</div>
					<div className="bg-white border border-slate-200 rounded-lg p-4">
						<p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Rows available</p>
						<p className="text-[24px] font-bold text-slate-900 mt-1">{totalRows}</p>
					</div>
					<div className="bg-white border border-slate-200 rounded-lg p-4">
						<p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Send-ready rows</p>
						<p className="text-[24px] font-bold text-slate-900 mt-1">{sendReady.rowCount}</p>
					</div>
					<div className="bg-white border border-slate-200 rounded-lg p-4">
						<p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Follow-up rows</p>
						<p className="text-[24px] font-bold text-slate-900 mt-1">{followups.rowCount}</p>
					</div>
				</section>

				<section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
					<div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
						<h2 className="text-[13px] font-semibold text-slate-900">File availability and purpose</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[760px] text-left">
							<thead className="bg-white border-b border-slate-200">
								<tr>
									<th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">File</th>
									<th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Rows</th>
									<th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{[sendReady, followups, targetSlate].map((item) => (
									<tr key={item.fileName}>
										<td className="px-4 py-3">
											<p className="text-[13px] font-semibold text-slate-900">{item.label}</p>
											<p className="text-[13px] text-slate-500 mt-0.5">{item.fileName}</p>
										</td>
										<td className="px-4 py-3 text-[13px] text-slate-700">{item.rowCount}</td>
										<td className="px-4 py-3 text-[13px]">
											{item.error ? (
												<span className="text-rose-700">Unavailable ({item.error})</span>
											) : (
												<span className="text-emerald-700">Available</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
						<div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
							<h2 className="text-[13px] font-semibold text-slate-900">Send-ready preview (top 15)</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full min-w-[680px] text-left">
								<thead className="bg-white border-b border-slate-200">
									<tr>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Name</th>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Company</th>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Email</th>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{sendReady.rows.slice(0, 15).map((row, idx) => (
										<tr key={`send-${idx}`}>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['full_name', 'name'])}</td>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['company'])}</td>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['email_guess', 'email'])}</td>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['status'])}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
						<div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
							<h2 className="text-[13px] font-semibold text-slate-900">Follow-up preview (top 15)</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full min-w-[680px] text-left">
								<thead className="bg-white border-b border-slate-200">
									<tr>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Name</th>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Company</th>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Email</th>
										<th className="px-4 py-2 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{followups.rows.slice(0, 15).map((row, idx) => (
										<tr key={`follow-${idx}`}>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['full_name', 'name'])}</td>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['company'])}</td>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['email_guess', 'email'])}</td>
											<td className="px-4 py-2 text-[13px] text-slate-700">{previewValue(row, ['status'])}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</section>

				<p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
			</main>
		</div>
	)
}
