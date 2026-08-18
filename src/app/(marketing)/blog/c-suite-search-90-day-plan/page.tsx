import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('c-suite-search-90-day-plan')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/c-suite-search-90-day-plan',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/c-suite-search-90-day-plan',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function CSuiteSearch90DayPlanPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/c-suite-search-90-day-plan"
      cta={{
        headline: 'Use phased execution, not reactive intensity.',
        body: 'Run the first 90 days as setup, momentum, and conversion phases with explicit weekly priorities.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Most executive campaigns underperform because all phases are blended together. Better outcomes come from sequencing work by phase.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Days 1-30: setup quality</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Define target scope and role narrative.</li>
          <li>Build initial target-company and relationship map.</li>
          <li>Establish weekly review cadence and scorecard.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Days 31-60: momentum quality</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Expand qualified outreach based on signal changes.</li>
          <li>Increase prep depth for active conversation tracks.</li>
          <li>Trim low-probability tracks to protect focus.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Days 61-90: conversion quality</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Prioritize mandate-fit opportunities over activity volume.</li>
          <li>Upgrade objection handling and board-facing narrative.</li>
          <li>Use weekly retrospectives to prevent execution drift.</li>
        </ul>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For consistency and implementation evidence behind this phased model, review the section below.
          </p>
          <Link href="/evidence-hub#behavior-change" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Review behavior-change evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
