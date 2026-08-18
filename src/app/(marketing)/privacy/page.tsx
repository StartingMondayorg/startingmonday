import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Starting Monday',
  description: 'How Starting Monday collects, uses, and protects your personal information.',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Plain-language employer privacy section - visible before legal text */}
        <div className="bg-slate-950 rounded-lg px-8 py-8 mb-12">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">What matters most</p>
          <h2 className="text-[22px] font-bold text-white mb-4 leading-snug">Your employer cannot see this.</h2>
          <div className="space-y-3 text-[14px] text-slate-200 leading-relaxed">
            <p>Starting Monday is a private tool for your career. Here is what your employer, colleagues, and recruiters cannot see:</p>
            <ul className="space-y-2.5 mt-4">
              {[
                'Your account does not appear in any directory, marketplace, or recruiter search.',
                'Your target companies are visible only to you. We do not share your watchlist with anyone.',
                'Your resume, positioning summary, and career notes are stored securely and never shared with third parties.',
                'We do not sell your data. We do not share your data with recruiters, employers, or data brokers.',
                'We do not use your profile data to train AI models without explicit consent.',
                'The only people who can see your data are you and Starting Monday\'s founding team, for the purpose of operating the product.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 list-none">
                  <span className="text-orange-500 font-bold mt-0.5 shrink-0">&#10003;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-slate-200 text-[13px]">If you use a work email to sign up, that does not give your employer any access. Your account is yours.</p>
          </div>
        </div>

        {/* Google API Data Disclosure - required for Google OAuth verification */}
        <section className="mb-12 pb-12 border-b border-slate-200">
          <h1 className="text-[22px] font-bold text-slate-900 mb-6">Privacy Policy</h1>

          <h2 className="text-[17px] font-bold text-slate-900 mb-3">Google User Data</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Starting Monday uses Google Sign-In to allow users to create an account and authenticate.
            The following describes how we access, use, store, and share Google user data.
          </p>

          <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Data Accessed</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            When you sign in with Google, Starting Monday requests access to the following data via
            standard OAuth 2.0 scopes:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[14px] text-slate-600">
            <li><strong>Email address</strong> (scope: <code className="text-[13px] bg-slate-100 px-1 rounded">email</code>) - used to identify your account and send you product communications.</li>
            <li><strong>Basic profile information</strong> (scope: <code className="text-[13px] bg-slate-100 px-1 rounded">profile</code>) - your name and profile picture, used to personalize your account.</li>
            <li><strong>OpenID Connect identity token</strong> (scope: <code className="text-[13px] bg-slate-100 px-1 rounded">openid</code>) - used to verify your identity during sign-in.</li>
          </ul>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Starting Monday does not access Google Calendar, Gmail, Google Drive, Google Contacts,
            or any other Google service unless you explicitly connect an additional integration such as Google Calendar.
            No data beyond the scopes you authorize is requested or collected.
          </p>

          <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Data Usage</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Google user data is used solely for the following purposes:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[14px] text-slate-600">
            <li>Creating and authenticating your Starting Monday account</li>
            <li>Displaying your name within the product interface</li>
            <li>Sending transactional emails (such as your daily briefing) to your email address</li>
          </ul>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Google user data is never used to train AI models, sold to third parties, shared with
            recruiters or employers, or used for advertising purposes.
          </p>

          <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Data Storage</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Your email address and basic profile information are stored securely in our authentication
            provider (Supabase), hosted on AWS infrastructure. Data is encrypted at rest and in transit.
            We retain your data for as long as your account is active. You may permanently delete your
            account and all associated data at any time from your account settings.
          </p>

          <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Data Sharing</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Starting Monday does not sell, share, or transfer Google user data to any third party,
            except as required to operate the service (such as storing data with our infrastructure
            provider, Supabase). We do not share Google user data with advertisers, data brokers,
            executive search firms, or any other external parties.
          </p>

          <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Compliance</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            Starting Monday&rsquo;s use of Google user data complies with the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-900 transition-colors"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section className="mb-12 pb-12 border-b border-slate-200">
          <h2 className="text-[17px] font-bold text-slate-900 mb-3">Role-aware signals and relationship data</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            To support new leadership, technical leadership, and delivery leadership workflows, Starting Monday stores role-profile fields,
            company signal metadata, relationship-targeting scores, and outreach recommendations.
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[14px] text-slate-600">
            <li>Role profile fields include role family, role title, seniority level, and workflow variant.</li>
            <li>Signal metadata may include company announcements, filings, hiring trends, and source confidence details.</li>
            <li>Relationship targeting metadata may include recruiter flags, warm-path indicators, and recommendation confidence tiers.</li>
            <li>When premium contact intelligence is enabled, business email suggestions are shown with confidence bands and usage limits.</li>
          </ul>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            We retain this data only to operate and improve recommendation quality, enforce safety controls, and provide auditability.
            We do not sell these data categories to recruiters, employers, or data brokers.
          </p>
        </section>

        <script
          src="https://app.termly.io/embed-policy.min.js"
          data-auto-block="on"
          async
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <div {...({ name: 'termly-embed', 'data-id': 'bff39340-b8bd-45af-854c-2bbabb575b3c' } as any)} />
      </main>

      <footer className="border-t border-slate-100 px-6 py-6 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href="/" className="text-[12px] text-slate-200 hover:text-slate-600 transition-colors">
            Back to home
          </Link>
        </div>
        <p className="max-w-4xl mx-auto mt-4 text-[11px] text-slate-200">
          &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
        </p>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

