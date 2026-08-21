'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
type Category = 'feature_request' | 'ui_ux' | 'bug' | 'performance' | 'other'

type Idea = {
  id: string
  name: string | null
  category: Category
  body: string
  ai_rating: { score: number; rationale: string } | null
  created_at: string
}

const CATEGORY_LABELS: Record<Category, string> = {
  feature_request: 'Feature',
  ui_ux: 'UI / UX',
  bug: 'Bug',
  performance: 'Performance',
  other: 'Other',
}

const CATEGORIES: Array<{ value: Category | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'feature_request', label: 'Features' },
  { value: 'ui_ux', label: 'UI / UX' },
  { value: 'bug', label: 'Bugs' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
]

function getInitials(name?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.trim().slice(0, 2).toUpperCase()
  }
  return '?'
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<Category | ''>('')
  const [sortBy, setSortBy] = useState<'recent' | 'rated'>('recent')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formCategory, setFormCategory] = useState<Category | ''>('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ sortBy })
      if (category) params.set('category', category)
      const res = await fetch(`/api/ideas?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setIdeas(data.ideas ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [category, sortBy])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category: formCategory, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitState('error')
        return
      }
      setSubmitState('success')
      setName('')
      setEmail('')
      setFormCategory('')
      setBody('')
      fetchIdeas()
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitState('error')
    } finally {
      setSubmitting(false)
    }
  }

  const labelCls = 'block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5'

  return (
    <div className="min-h-screen bg-muted">

      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-[15px] font-bold text-foreground tracking-tight">
            Starting Monday
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button size="sm" render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Log in
                </Link>
                <Button size="sm" render={<Link href="/signup" />}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* Hero */}
        <div>
          <h1 className="text-[28px] font-bold text-foreground mb-2">Ideas & Feedback</h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl">
            Tell us what would make Starting Monday better. Every month we randomly select one submitter to receive a <span className="font-semibold text-muted-foreground">$25 Amazon gift card</span>.
          </p>
        </div>

        {/* Submit form */}
        <Card className="p-6">
          <h2 className="text-[15px] font-bold text-foreground mb-4">Share your idea</h2>

          {submitState === 'success' ? (
            <div className="text-center py-6">
              <p className="text-[22px] font-bold text-foreground mb-2">Thank you!</p>
              <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                Your idea has been submitted. You are entered in this month&apos;s gift card drawing.
              </p>
              <Button variant="link" onClick={() => setSubmitState('idle')} className="text-[13px]">
                Submit another idea
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className={labelCls}>Name <span className="text-muted-foreground font-normal normal-case tracking-normal">optional</span></Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className={labelCls}>Email <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label className={labelCls}>Category <span className="text-destructive">*</span></Label>
                <Select value={formCategory || undefined} onValueChange={(value) => setFormCategory(value as Category)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.value !== '').map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={labelCls}>Your idea <span className="text-destructive">*</span></Label>
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="I'd love it if Starting Monday could..."
                  rows={4}
                  required
                  minLength={10}
                  maxLength={2000}
                  className="w-full resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1 text-right">{body.length} / 2000</p>
              </div>

              {submitState === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs">
                  Your email is private and only used to contact you if you win the monthly gift card.
                </p>
                <Button
                  type="submit"
                  disabled={submitting || !email || !formCategory || !body}
                  className="shrink-0"
                >
                  {submitting ? 'Submitting...' : 'Submit idea'}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Browse ideas */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="text-[15px] font-bold text-foreground mr-auto">Recent ideas</h2>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'rated')}>
              <SelectTrigger size="sm" className="text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="rated">Highest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category tabs */}
          <ToggleGroup
            value={category ? [category] : ['']}
            onValueChange={(values) => { if (values[0] !== undefined) setCategory(values[0] as Category | '') }}
            className="flex-wrap gap-1.5 mb-4"
          >
            {CATEGORIES.map(cat => (
              <ToggleGroupItem
                key={cat.value}
                value={cat.value}
                className="rounded px-3 py-1.5 text-[12px] font-semibold bg-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {cat.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded w-1/4 mb-3" />
                      <div className="h-3 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-[14px] text-muted-foreground">No ideas yet in this category. Be the first!</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {ideas.map(idea => (
                <Card key={idea.id} className="p-5">
                  <div className="flex gap-4">

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold shrink-0">
                      {getInitials(idea.name)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {idea.name?.trim() ? idea.name.trim().split(' ')[0] : 'Anonymous'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">&middot;</span>
                        <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded">
                          {CATEGORY_LABELS[idea.category]}
                        </span>
                        {idea.ai_rating && (
                          <span className="bg-primary/10 text-primary text-[11px] font-semibold px-2 py-0.5 rounded">
                            {idea.ai_rating.score}/10
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[14px] text-muted-foreground leading-relaxed">{idea.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
