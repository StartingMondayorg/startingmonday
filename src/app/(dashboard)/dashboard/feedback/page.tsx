'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { FeedbackItem } from '@/lib/database.types'
import { BrandIcon } from '@/app/components/BrandIcon'

type FeedbackCategory = 'bug' | 'feature_request' | 'ui_ux' | 'performance' | 'other'
type FeedbackStatus = 'new' | 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'declined'

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  ui_ux: 'UI/UX',
  performance: 'Performance',
  other: 'Other',
}

const CATEGORY_ICONS: Record<FeedbackCategory, 'bug' | 'feature' | 'uiux' | 'performance' | 'other'> = {
  bug: 'bug',
  feature_request: 'feature',
  ui_ux: 'uiux',
  performance: 'performance',
  other: 'other',
}

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  under_review: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-orange-100 text-orange-700',
  shipped: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  declined: 'Declined',
}

export default function FeedbackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | ''>('')
  const [sortBy, setSortBy] = useState<'recent' | 'votes' | 'comments'>('recent')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch feedback items
  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        sortBy,
        limit: '50',
      })
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/feedback/items?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.items || [])
    } catch (err) {
      console.error('Error fetching feedback:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [selectedCategory, selectedStatus, sortBy, searchTerm])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess(false)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const body = formData.get('body') as string
    const category = formData.get('category') as FeedbackCategory

    if (!title.trim() || !body.trim() || !category) {
      setSubmitError('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/feedback/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitSuccess(true)
      ;(e.target as HTMLFormElement).reset()
      setTimeout(() => setSubmitSuccess(false), 3000)
      fetchItems()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (itemId: string, hasVoted: boolean) => {
    try {
      const method = hasVoted ? 'DELETE' : 'POST'
      const res = await fetch(`/api/feedback/items/${itemId}/vote`, { method })
      if (res.ok) {
        fetchItems()
      }
    } catch (err) {
      console.error('Error voting:', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] font-semibold text-slate-900 hover:text-orange-600 transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-[18px] font-bold text-slate-900">Feedback & Ideas</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
{/* Submit Form */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-slate-900">Share Your Feedback</h2>
          <p className="text-[13px] text-slate-600">
            Help us improve Starting Monday. Your feedback is valuable and we review everything.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-[13px] text-red-700">
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded p-3 text-[13px] text-green-700">
                Thank you! We'll review your feedback within 24 hours.
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-slate-900 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="Brief summary of your feedback"
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-900 mb-2">
                Description *
              </label>
              <textarea
                name="body"
                placeholder="Tell us more about what you experienced or what you'd like to see..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="category-input" className="block text-[12px] font-semibold text-slate-900 mb-2">
                Category *
              </label>
              <select
                id="category-input"
                name="category"
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                <option value="bug">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="ui_ux">UI/UX Suggestion</option>
                <option value="performance">Performance Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white px-4 py-2 rounded font-semibold text-[13px] transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </section>

        {/* Filters & Sorting */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="category-filter" className="block text-[11px] font-semibold text-slate-600 uppercase mb-1.5">
                Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as FeedbackCategory | '')}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Categories</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Feature</option>
                <option value="ui_ux">UI/UX</option>
                <option value="performance">Performance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-[11px] font-semibold text-slate-600 uppercase mb-1.5">
                Status
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus | '')}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="shipped">Shipped</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort-filter" className="block text-[11px] font-semibold text-slate-600 uppercase mb-1.5">
                Sort By
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'votes' | 'comments')}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="recent">Most Recent</option>
                <option value="votes">Most Votes</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1.5">
                Search
              </label>
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Feedback Items List */}
        <section className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No feedback found. Be the first to share!
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-slate-900 line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[12px] text-slate-600 line-clamp-2">{item.body}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                        STATUS_COLORS[item.status as FeedbackStatus]
                      }`}
                    >
                      {STATUS_LABELS[item.status as FeedbackStatus]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <div className="flex gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-700 rounded">
                      <BrandIcon name={CATEGORY_ICONS[item.category as FeedbackCategory]} className="h-3.5 w-3.5 text-orange-600" />
                      {CATEGORY_LABELS[item.category as FeedbackCategory]}
                    </span>
                    {item.user_profiles && (
                      <span>by {item.user_profiles.full_name}</span>
                    )}
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-4 text-[12px] border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleVote(item.id, item.user_voted)}
                    className={`flex items-center gap-1 transition-colors ${
                      item.user_voted
                        ? 'text-orange-600 font-semibold'
                        : 'text-slate-500 hover:text-orange-600'
                    }`}
                  >
                    Votes {item.vote_count}
                  </button>
                  <div className="flex items-center gap-1 text-slate-500">
                    Comments {item.comment_count}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
