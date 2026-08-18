import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('evidence-hub-coaching-session-framework')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/evidence-hub-coaching-session-framework',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/evidence-hub-coaching-session-framework',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function EvidenceHubCoachingSessionFrameworkPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/evidence-hub-coaching-session-framework"
      cta={{
        headline: 'Turn coaching sessions into execution systems.',
        body: 'Use evidence-backed claims to structure agenda, assignments, and progress reviews week over week.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>Weekly coaching is strongest when each session maps evidence to one decision and one execution commitment.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Session design</h2>
        <p>Start with one claim from the Evidence Hub, discuss current context, and define a concrete action tied to that claim.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Assignment structure</h2>
        <p>Every session should end with one measurable assignment, due date, and quality bar for completion.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Progress review loop</h2>
        <p>Review completion weekly, adapt constraints, and carry forward only actions that improve decision quality and momentum.</p>
        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">See coaching mechanism evidence and outcome conditions in detail.</p>
          <Link href="/evidence-hub#coaching-effectiveness" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">Review coaching-effectiveness evidence</Link>
        </section>
      </div>
    </BlogPost>
  )
}
