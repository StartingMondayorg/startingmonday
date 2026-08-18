import Link from 'next/link'

export const metadata = {
  title: 'Security & Data - Starting Monday',
  description: 'How Starting Monday stores, protects, and handles your search data.',
  alternates: {
    canonical: 'https://startingmonday.app/security',
  },
  openGraph: {
    title: 'Security & Data - Starting Monday',
    description: 'How Starting Monday stores, protects, and handles your search data.',
    url: 'https://startingmonday.app/security',
    type: 'website',
  },
}

export default function SecurityPage() {
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
<div className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">Security and data</p>
          <h1 className="text-[28px] font-bold text-slate-900 mb-4 leading-tight">
            What we store, how it is protected, and how to delete it.
          </h1>
          <p className="text-[15px] text-slate-500 leading-relaxed max-w-2xl">
            This page answers the questions a security professional would ask before trusting us with sensitive career information.
            If you have a question this page does not answer, email us at{' '}
            <a href="mailto:hello@startingmonday.app" className="text-slate-700 underline">hello@startingmonday.app</a>.
          </p>
        </div>

        <div className="space-y-10 divide-y divide-slate-100">

          <section className="pt-10 first:pt-0">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">How your data is stored</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              All user data is stored in a PostgreSQL database hosted by Supabase on AWS infrastructure.
              Your records are isolated by user ID using row-level security (RLS). No other user, including other Starting Monday subscribers, can query or access your data.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              The database is not accessible from the public internet. All reads and writes go through authenticated server-side API routes. There is no direct database access from the client.
            </p>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Encryption</h2>
            <ul className="space-y-3 text-[14px] text-slate-600">
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span><strong className="text-slate-800">At rest:</strong> AES-256 encryption, provided at the infrastructure level by Supabase and AWS. Every field in your profile, your company notes, and your career history is encrypted on disk.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span><strong className="text-slate-800">In transit:</strong> TLS 1.2 or higher on all connections between your browser, our servers, and the database. There is no unencrypted channel.</span>
              </li>
            </ul>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Who can access your data</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              Your data is readable only by your authenticated session. No Starting Monday employee or founder has routine query access to individual user records. Database access requires authenticated credentials and is logged.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              We have no data-sharing relationships with employers, executive search firms, staffing agencies, or recruiters. We do not sell leads. Your identity, your targets, and your activity are not visible to anyone outside your account.
            </p>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">AI generation and third parties</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              Starting Monday uses the Anthropic API to generate prep briefs, strategy documents, and briefings. When you generate a brief, the relevant context (your profile, company notes, and scan data) is transmitted to Anthropic for generation only.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              Anthropic does not store your data for training purposes under our API agreement. The content you send is used to generate the response and is not retained by Anthropic beyond the request lifecycle.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              No other third party receives your profile, notes, resume, or career data.
            </p>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Authentication</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              Authentication is handled by Supabase Auth, served from{' '}
              <span className="font-mono text-[13px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">auth.startingmonday.app</span>.
              This is a custom domain over Supabase infrastructure. You will never see a supabase.co subdomain in an authentication flow from Starting Monday.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              Sessions are JWT-based with configurable expiry. Tokens are stored in secure, HttpOnly cookies and are not accessible to JavaScript.
            </p>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Deleting your data</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              You can delete your sensitive career context at any time from your profile page after signing in, using the &quot;Delete sensitive notes&quot; option. This clears your positioning summary, beyond-resume notes, and verified career history. Your account, email, and pipeline remain active.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              To delete your account and all associated data permanently, go to Settings and use the account deletion option. All records are removed from our systems within 30 days.
            </p>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">What we do not do</h2>
            <ul className="space-y-3 text-[14px] text-slate-600">
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We do not use your data to train or fine-tune AI models.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We do not sell or rent your data to any third party.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We do not share your identity, targets, or activity with employers, search firms, or recruiters.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We do not run advertising or analytics that track you across other sites.</span>
              </li>
            </ul>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">AI governance and regulatory compliance</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
              Senior executives at enterprise companies are fielding AI governance questions from their own boards and legal teams. Starting Monday processes career data that falls under these frameworks. Here is our position.
            </p>
            <ul className="space-y-4 text-[14px] text-slate-600 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span><strong className="text-slate-800">CCPA:</strong> California residents can request access to, correction of, or deletion of all personal data at any time. Use the account deletion option in Settings. We do not sell personal information and have never sold personal information.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span><strong className="text-slate-800">EU AI Act:</strong> Starting Monday uses AI to generate career documents - prep briefs, outreach drafts, and strategy summaries. This is an assistive tool that produces draft output for human review. No automated decisions are made about users. All outputs are reviewed and acted on by the user, not by automated systems acting on their behalf.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span><strong className="text-slate-800">Enterprise procurement:</strong> If your organization requires AI vendor documentation, a data processing agreement (DPA), or AI usage disclosure for procurement review, contact us at{' '}<a href="mailto:hello@startingmonday.app" className="text-slate-800 underline">hello@startingmonday.app</a>. We provide these on request.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span><strong className="text-slate-800">AI model choice:</strong> We use Anthropic Claude. Anthropic does not use API data to train models under our agreement. We chose Anthropic specifically because of how they handle data and because the model calibrates better to executive-level language than the alternatives.</span>
              </li>
            </ul>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Incident response</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
              If we detect unauthorized access to your data, here is what we do and when.
            </p>
            <ul className="space-y-3 text-[14px] text-slate-600 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We contain and investigate the incident within 24 hours of detection.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We notify affected users by email within 72 hours of confirming a breach. The notification includes: what data was accessed, when the incident occurred, what we have done to contain it, and what steps you can take.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-200 shrink-0 mt-0.5 font-bold">+</span>
                <span>We cooperate with law enforcement and provide required regulatory notifications under applicable law.</span>
              </li>
            </ul>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              To report a suspected security vulnerability or incident, email{' '}
              <a href="mailto:hello@startingmonday.app" className="text-slate-800 underline">hello@startingmonday.app</a>
              {' '}immediately. We respond to all security disclosures within one business day.
            </p>
          </section>

          <section className="pt-10">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Questions</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              If you have a security question, a disclosure, or a data request, contact us directly at{' '}
              <a href="mailto:hello@startingmonday.app" className="text-slate-800 underline">hello@startingmonday.app</a>.
              We respond to all security inquiries within one business day.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <Link href="/privacy" className="text-[13px] text-slate-200 hover:text-slate-700 underline transition-colors">
            Privacy Policy
          </Link>
          <span className="text-slate-200 mx-3">|</span>
          <Link href="/" className="text-[13px] text-slate-200 hover:text-slate-700 transition-colors">
            Back to Starting Monday
          </Link>
        </div>

      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

