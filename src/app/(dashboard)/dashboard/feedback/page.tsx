'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { FeedbackItem } from '@/lib/database.types'
import { BrandIcon } from '@/app/components/BrandIcon'
import { Alert, AlertDescription, Badge, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Toggle } from '@/components/ui'
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

const STATUS_VARIANT: Record<FeedbackStatus, 'secondary' | 'info' | 'default' | 'warning' | 'success' | 'destructive'> = {
  new: 'secondary',
  under_review: 'info',
  planned: 'default',
  in_progress: 'warning',
  shipped: 'success',
  declined: 'destructive',
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  declined: 'Declined',
}

// shadcn Select can't have an item with value "" — use this sentinel for the
// "all" filter options and normalize back to '' when reading it out.
const ALL = '__none__'

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
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-[18px] font-bold text-foreground">Feedback & Ideas</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Submit Form */}
        <Card className="p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-foreground">Share Your Feedback</h2>
          <p className="text-[13px] text-muted-foreground">
            Help us improve Starting Monday. Your feedback is valuable and we review everything.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <Alert variant="destructive" className="p-3">
                <AlertDescription className="text-[13px]">{submitError}</AlertDescription>
              </Alert>
            )}
            {submitSuccess && (
              <Alert variant="success" className="p-3">
                <AlertDescription className="text-[13px]">
                  Thank you! We&apos;ll review your feedback within 24 hours.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="block text-[12px] font-semibold text-foreground mb-2">
                Title *
              </Label>
              <Input
                type="text"
                name="title"
                placeholder="Brief summary of your feedback"
                className="w-full text-[13px]"
                required
              />
            </div>

            <div>
              <Label className="block text-[12px] font-semibold text-foreground mb-2">
                Description *
              </Label>
              <Textarea
                name="body"
                placeholder="Tell us more about what you experienced or what you'd like to see..."
                rows={4}
                className="w-full text-[13px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="category-input" className="block text-[12px] font-semibold text-foreground mb-2">
                Category *
              </Label>
              <Select name="category" required>
                <SelectTrigger id="category-input" className="w-full text-[13px]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="ui_ux">UI/UX Suggestion</SelectItem>
                  <SelectItem value="performance">Performance Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-[13px] font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </Card>

        {/* Filters & Sorting */}
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="category-filter" className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                Category
              </Label>
              <Select
                value={selectedCategory || ALL}
                onValueChange={(value) => setSelectedCategory(value === ALL ? '' : value as FeedbackCategory)}
              >
                <SelectTrigger id="category-filter" className="w-full text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Categories</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature</SelectItem>
                  <SelectItem value="ui_ux">UI/UX</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter" className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                Status
              </Label>
              <Select
                value={selectedStatus || ALL}
                onValueChange={(value) => setSelectedStatus(value === ALL ? '' : value as FeedbackStatus)}
              >
                <SelectTrigger id="status-filter" className="w-full text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort-filter" className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'votes' | 'comments')}>
                <SelectTrigger id="sort-filter" className="w-full text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="votes">Most Votes</SelectItem>
                  <SelectItem value="comments">Most Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                Search
              </Label>
              <Input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-[12px]"
              />
            </div>
          </div>
        </Card>

        {/* Feedback Items List */}
        <section className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback found. Be the first to share!
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-foreground line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2">{item.body}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant={STATUS_VARIANT[item.status as FeedbackStatus]} className="whitespace-nowrap">
                      {STATUS_LABELS[item.status as FeedbackStatus]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted text-muted-foreground rounded">
                      <BrandIcon name={CATEGORY_ICONS[item.category as FeedbackCategory]} className="h-3.5 w-3.5 text-primary" />
                      {CATEGORY_LABELS[item.category as FeedbackCategory]}
                    </span>
                    {item.user_profiles && (
                      <span>by {item.user_profiles.full_name}</span>
                    )}
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-4 text-[12px] border-t border-border pt-3">
                  <Toggle
                    pressed={item.user_voted}
                    onPressedChange={() => handleVote(item.id, item.user_voted)}
                    className={`h-auto px-0 gap-1 hover:bg-transparent ${
                      item.user_voted
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Votes {item.vote_count}
                  </Toggle>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    Comments {item.comment_count}
                  </div>
                </div>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
