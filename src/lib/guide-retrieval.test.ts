import { describe, expect, it } from 'vitest'
import { evaluateGuideRetrieval, rankGuideEntries, type GuideEntry } from '@/lib/guide-retrieval'

const ENTRIES: GuideEntry[] = [
  {
    id: '1',
    title: 'Complete the setup checklist',
    body: 'Begin with guided onboarding checklist.',
    type: 'get-started',
    url: '/dashboard',
    tags: ['get-started', 'onboarding'],
  },
  {
    id: '2',
    title: 'Set your profile and resume',
    body: 'Update profile and resume context.',
    type: 'feature',
    url: '/dashboard/profile',
    tags: ['profile'],
  },
  {
    id: '3',
    title: 'Starting Monday article',
    body: 'Read our latest blog post.',
    type: 'article',
    url: '/blog/example',
    tags: ['article', 'blog'],
  },
]

describe('guide retrieval ranking', () => {
  it('ranks onboarding queries to setup checklist', () => {
    const ranked = rankGuideEntries(ENTRIES, 'How do I start onboarding setup?', 3)
    expect(ranked[0]?.entry.url).toBe('/dashboard')
  })

  it('maps article/blog synonym in ranking', () => {
    const ranked = rankGuideEntries(ENTRIES, 'Where is the latest blog article?', 3)
    expect(ranked[0]?.entry.url).toBe('/blog/example')
  })

  it('computes eval metrics with recall@3', () => {
    const summary = evaluateGuideRetrieval(
      [
        { question: 'How do I set up my account?', expectedAnyOfUrls: ['/dashboard'] },
        { question: 'How can I update my profile?', expectedAnyOfUrls: ['/dashboard/profile'] },
      ],
      ENTRIES,
    )

    expect(summary.total).toBe(2)
    expect(summary.recallAt3).toBeGreaterThanOrEqual(1)
  })
})
