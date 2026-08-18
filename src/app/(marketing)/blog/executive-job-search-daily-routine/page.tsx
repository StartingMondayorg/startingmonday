import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-job-search-daily-routine')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-job-search-daily-routine',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-job-search-daily-routine',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveJobSearchDailyRoutinePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-job-search-daily-routine"
      cta={{
        headline: 'Build the routine once, then let it compound.',
        body: 'Starting Monday automates the monitoring and briefing layer so your daily search habit stays focused on conversation quality, not manual tracking.',
        label: 'Try the system free for 30 days ->',
        href: '/signup',
        note: 'No credit card required.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Most executive searches do not fail because the candidate lacks experience. They fail because
          the daily operating rhythm collapses by week three. Outreach becomes inconsistent, follow-up
          gets delayed, and momentum disappears quietly.
        </p>

        <p>
          The top 1 percent of senior candidates do one thing differently: they run the search like an
          operating cadence, not a motivation project.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What elite candidates do every day</h2>

        <p>
          They do not spend all day searching. They run a focused 60 to 90 minute block with clear
          objectives and finish with a closed loop. The structure is simple and repeatable.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">1. Review fresh signals first</h3>

        <p>
          Before touching email, they review what changed overnight at target companies: executive moves,
          funding, org announcements, and role postings. This determines who is worth contacting now,
          while relevance is high.
        </p>

        <p>
          Average candidates start with inbox triage. Top candidates start with market intelligence.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">2. Prioritize five high-leverage contacts</h3>

        <p>
          They pick five people for the day: two warm reactivations, two strategic referrals, and one
          cold but signal-based outreach. Limiting the list prevents low-quality volume.
        </p>

        <p>
          The question is not &ldquo;How many messages did I send?&rdquo; It is &ldquo;How many quality conversations did
          I start?&rdquo;
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">3. Personalize from context, not flattery</h3>

        <p>
          Their outreach references something real: a leadership transition, a portfolio event,
          a recent interview, or a strategic initiative. Generic admiration messaging gets ignored.
        </p>

        <p>
          High-performing candidates are precise. They connect their own track record to the recipient&rsquo;s
          current operating reality in two sentences.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">4. Prepare for tomorrow&rsquo;s conversations today</h3>

        <p>
          Every day includes at least one prep brief review before a call happens. They walk into
          conversations with a view on the company&rsquo;s trajectory, decision makers, and likely risk agenda.
        </p>

        <p>
          They show up as peers with perspective, not candidates waiting to be evaluated.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">5. Close the day with follow-up discipline</h3>

        <p>
          They log outcomes immediately: who replied, who needs a follow-up, what was promised, and what
          deadline was set. Tomorrow starts from a clean state, not from memory.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">A practical daily template (75 minutes)</h2>

        <ul className="list-disc pl-5 space-y-2">
          <li>10 minutes: review signal feed and career page changes</li>
          <li>15 minutes: select five contacts and define one-line reason for each outreach</li>
          <li>25 minutes: draft and send outreach (quality over quantity)</li>
          <li>15 minutes: prep one upcoming conversation with a structured brief</li>
          <li>10 minutes: update tracker, schedule follow-ups, clear tomorrow priorities</li>
        </ul>

        <p>
          This is short by design. The point is consistency. A repeatable 75-minute system beats
          occasional three-hour bursts every time.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What average candidates do instead</h2>

        <p>
          They scan job boards first. They send generic outreach to too many people. They skip prep
          because they are busy. They postpone follow-up tracking until the weekend. By month two,
          they feel busy but cannot explain pipeline progress.
        </p>

        <p>
          The difference is not effort. It is operating design.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Weekly metrics that matter</h2>

        <p>
          Top candidates monitor a few indicators weekly, then adjust quickly:
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>New conversations started</li>
          <li>Response rate by outreach type (warm, referral, cold signal-based)</li>
          <li>Second-call conversion rate</li>
          <li>Overdue follow-ups older than 7 days</li>
          <li>Target companies with no recent touch in 14 days</li>
        </ul>

        <p>
          If response rate drops below 15 to 20 percent, they rewrite messaging. If second calls are low,
          they improve prep quality. If follow-up debt rises, they reduce new outreach temporarily and
          close loops first.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to make this sustainable</h2>

        <p>
          Automation should remove manual admin, not replace judgment. Use systems for tracking,
          reminders, and signal collection so your time goes to positioning and conversation quality.
        </p>

        <p>
          The executives who win searches fastest are not lucky. They are consistent in ways most people
          cannot see from the outside.
        </p>

        <p>
          If your search feels chaotic, do not work harder. Install a daily operating rhythm and protect
          it. The compounding effect shows up in two to three weeks.
        </p>

      </div>
    </BlogPost>
  )
}
