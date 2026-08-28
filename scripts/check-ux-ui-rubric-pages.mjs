#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const args = new Set(process.argv.slice(2))
const asJson = args.has('--json')

function toRelative(p) {
	return p.replace(/\\/g, '/')
}

function read(relativePath) {
	const fullPath = path.join(ROOT, relativePath)
	if (!fs.existsSync(fullPath)) {
		throw new Error(`Missing required file: ${relativePath}`)
	}
	return fs.readFileSync(fullPath, 'utf8')
}

function has(content, matcher) {
	if (matcher instanceof RegExp) return matcher.test(content)
	return content.includes(matcher)
}

/** @typedef {{ id: string, description: string, matcher: string | RegExp }} Rule */
/** @typedef {{ id: string, route: string, files: string[], rules: Rule[] }} PageSpec */

/** @type {PageSpec[]} */
const SPECS = [
	{
		id: 'homepage',
		route: '/',
		files: ['src/app/(marketing)/page.tsx', 'src/app/components/LandingPage.tsx'],
		rules: [
			{
				id: 'clarity-shortlist-frame',
					description: 'Hero headline keeps shortlist-before-posting positioning.',
					matcher: 'Be on the shortlist before the role is posted.',
			},
			{
				id: 'clarity-opening-line',
					description: 'Hero body copy keeps timing-and-outcomes narrative framing.',
					matcher: 'Reputation opens doors. Timing decides outcomes.',
			},
			{
				id: 'conversion-unified-method-flow',
				description: 'Homepage uses one consolidated method section heading.',
				matcher: 'How The Monday Engine Works',
			},
			{
				id: 'content-economy-no-signal-preview-block',
				description: 'Signal preview teaser block remains removed from homepage.',
				matcher: /Signal Briefing Preview|After lane selection/i,
			},
			{
				id: 'content-economy-no-key-takeaway-prefix',
				description: 'Legacy "Key takeaway:" prefix remains removed.',
				matcher: /Key takeaway:/i,
			},
			{
				id: 'discoverability-evidence-route',
				description: 'Homepage evidence CTA routes to early-signals anchor.',
				matcher: 'href="/evidence-hub#early-signals"',
			},
			{
				id: 'trust-private-by-default-expanded',
				description: 'Private-by-default copy includes collaborator visibility guardrail.',
				matcher: /visible only to you and explicitly invited collaborators/,
			},
		],
	},
	{
		id: 'pricing',
		route: '/pricing',
		files: ['src/app/(marketing)/pricing/page.tsx', 'src/app/(marketing)/pricing/pricing-cards.tsx'],
		rules: [
			{
				id: 'conversion-cta-copy',
				description: 'Pricing cards keep a primary signup CTA link.',
				matcher: /href="\/signup/,
			},
			{
				id: 'conversion-card-alignment',
				description: 'Pricing cards use flex-column stretch alignment.',
				matcher: 'flex flex-col',
			},
			{
				id: 'conversion-cta-bottom-alignment',
				description: 'Pricing CTA remains bottom-aligned with mt-auto.',
				matcher: 'mt-auto',
			},
			{
				id: 'trust-near-pricing',
				description: 'Pricing keeps employer-visibility privacy assurance.',
				matcher: 'Your employer cannot see your account or your search activity.',
			},
		],
	},
	{
		id: 'demo',
		route: '/demo',
		files: ['src/app/(marketing)/demo/page.tsx'],
		rules: [
			{
				id: 'cognitive-load-preset-company',
				description: 'Demo uses preset company to reduce input burden.',
				matcher: "const DEMO_COMPANY = 'Salesforce'",
			},
			{
				id: 'cognitive-load-run-limit',
				description: 'Demo run limit remains capped at five.',
				matcher: 'const MAX_RUNS = 5',
			},
			{
				id: 'conversion-cta',
				description: 'Demo includes a signup CTA routed from demo.',
				matcher: /href="\/signup\?from=demo"/,
			},
		],
	},
	{
		id: 'blog-index',
		route: '/blog',
		files: ['src/app/(marketing)/blog/page.tsx', 'src/app/(marketing)/blog/blog-chat.tsx'],
		rules: [
			{
				id: 'information-scent-demo-cta',
				description: 'Blog index provides demo CTA.',
				matcher: 'See a live prep brief',
			},
			{
				id: 'blog-chat-enabled',
				description: 'Blog index mounts Ask the blog helper.',
				matcher: '<BlogChat posts={BLOG_POSTS} />',
			},
			{
				id: 'blog-chat-label',
				description: 'Blog helper keeps Ask the blog heading.',
				matcher: 'Ask the blog',
			},
		],
	},
	{
		id: 'blog-role-signals',
		route: '/blog/how-we-estimate-early-role-signals',
		files: ['src/app/(marketing)/blog/how-we-estimate-early-role-signals/page.tsx'],
		rules: [
			{
				id: 'ip-protection-language',
				description: 'Public post avoids exposing exact detection details.',
				matcher: /without exposing the exact\s+detection methods we use/i,
			},
			{
				id: 'gated-details-cta',
				description: 'Detailed methodology remains gated to members.',
				matcher: 'available to Starting Monday members',
			},
			{
				id: 'conversion-cta',
				description: 'Post includes signup CTA.',
				matcher: 'Start free - 30 days, no card',
			},
		],
	},
	{
		id: 'method-and-evidence',
		route: '/method-and-evidence',
		files: ['src/app/(marketing)/method-and-evidence/page.tsx'],
		rules: [
			{
				id: 'dig-deeper-box',
				description: 'Method page retains Dig deeper section.',
				matcher: 'Dig deeper',
			},
			{
				id: 'dig-deeper-links',
				description: 'Method page links to references, evidence, and timing model.',
				matcher: /href="\/references"[\s\S]*href="\/evidence-hub"[\s\S]*href="\/blog\/how-we-estimate-early-role-signals"/,
			},
		],
	},
	{
		id: 'signup',
		route: '/signup',
		files: ['src/app/(auth)/signup/page.tsx'],
		rules: [
			{
				id: 'friction-jump-box-removed',
				description: 'Signup no longer shows jump navigation box.',
				matcher: /Jump to section/i,
			},
			{
				id: 'conversion-h1',
				description: 'Signup has a single clear H1 conversion heading.',
				matcher: /<h1\b[\s\S]*?<\/h1>/,
			},
		],
	},
	{
		id: 'dashboard-discover',
		route: '/dashboard/discover',
		files: ['src/app/(dashboard)/dashboard/discover/page.tsx'],
		rules: [
			{
				id: 'discover-brand-shell',
				description: 'Discover page preserves branded shell header styling.',
				// The shell used to be pinned with a literal bg-slate-900. It is now a
				// dark-scoped token surface, which is the same intent -- a dark header
				// band -- expressed in the theme vocabulary.
				matcher: /dark[^"']*\bbg-(?:card|background)\b/,
			},
			{
				id: 'discover-grid-density',
				description: 'Discover cards retain responsive grid density.',
				matcher: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
			},
			{
				id: 'discover-no-helper-copy-drift',
				description: 'Discover page avoids deprecated helper labels.',
				matcher: /Quick navigation|TL;DR/i,
			},
		],
	},
	{
		id: 'dashboard-discover-recommendation-detail',
		route: '/dashboard/discover/recommendation/[id]',
		files: ['src/app/(dashboard)/dashboard/discover/recommendation/[id]/page.tsx'],
		rules: [
			{
				id: 'discover-detail-source-transparency',
				description: 'Recommendation detail keeps source transparency chips.',
				matcher: 'Suggested Outreach People',
			},
			{
				id: 'discover-detail-actions',
				description: 'Recommendation detail retains action rail component.',
				matcher: '<RecommendationActions',
			},
			{
				id: 'discover-detail-signal-sections',
				description: 'Recommendation detail preserves key narrative sections.',
				matcher: /Why This Company[\s\S]*Key Signals[\s\S]*Key Attributes Match/,
			},
		],
	},
	{
		id: 'dashboard-admin-intelligence',
		route: '/dashboard/admin/intelligence',
		files: ['src/app/(dashboard)/dashboard/admin/intelligence/page.tsx'],
		rules: [
			{
				id: 'intelligence-kpi-heading',
				description: 'Admin intelligence keeps discover KPI heading.',
				matcher: 'Discover conversion + quality (last 30 days)',
			},
			{
				id: 'intelligence-kpi-target-cards',
				description: 'Admin intelligence preserves threshold KPI cards.',
				matcher: /Narrative Open Rate[\s\S]*Outreach Start Rate[\s\S]*Suggested People Acceptance[\s\S]*Add-to-Watchlist Lift/,
			},
			{
				id: 'intelligence-compact-metric-grid',
				description: 'Admin intelligence keeps compact top metric grid.',
				matcher: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3',
			},
		],
	},
]

const pageResults = []

for (const spec of SPECS) {
	const resolvedFiles = spec.files.map((file) => ({
		file,
		content: read(file),
	}))

	const checks = spec.rules.map((rule) => {
		const matchedIn = resolvedFiles.find((entry) => has(entry.content, rule.matcher))

		const isNegativeRule =
			rule.id.includes('no-signal-preview-block') ||
			rule.id.includes('no-key-takeaway-prefix') ||
			rule.id.includes('jump-box-removed') ||
			rule.id.includes('no-helper-copy-drift')

		const passed = isNegativeRule ? !matchedIn : Boolean(matchedIn)
		const observed = matchedIn ? toRelative(matchedIn.file) : null

		return {
			id: rule.id,
			description: rule.description,
			passed,
			observed,
		}
	})

	const passCount = checks.filter((check) => check.passed).length
	const pagePassed = passCount === checks.length
	pageResults.push({
		id: spec.id,
		route: spec.route,
		files: resolvedFiles.map((entry) => toRelative(entry.file)),
		passCount,
		totalChecks: checks.length,
		passed: pagePassed,
		checks,
	})
}

const failedPages = pageResults.filter((result) => !result.passed)
const summary = {
	totalPages: pageResults.length,
	passedPages: pageResults.length - failedPages.length,
	failedPages: failedPages.length,
}

if (asJson) {
	process.stdout.write(
		JSON.stringify(
			{
				summary,
				pages: pageResults,
			},
			null,
			2
		) + '\n'
	)
} else {
	console.log('UX/UI rubric page gate')
	console.log(`Pages: ${summary.passedPages}/${summary.totalPages} passing`)

	for (const page of pageResults) {
		const marker = page.passed ? 'PASS' : 'FAIL'
		console.log(`\n[${marker}] ${page.route} (${page.passCount}/${page.totalChecks})`)
		for (const check of page.checks) {
			const status = check.passed ? '  - OK ' : '  - ERR'
			const observed = check.observed ? ` [${check.observed}]` : ''
			console.log(`${status} ${check.description}${observed}`)
		}
	}
}

if (failedPages.length > 0) {
	process.exitCode = 1
} else if (!asJson) {
	console.log('\nAll UX/UI rubric page checks passed.')
}
