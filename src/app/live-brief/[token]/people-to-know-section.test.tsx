import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PeopleToKnowSection from './people-to-know-section'

describe('PeopleToKnowSection', () => {
  it('renders title-only handoffs and safe external destinations', () => {
    const html = renderToStaticMarkup(<PeopleToKnowSection entries={[{
      companyName: 'Acme & Co',
      roleTitle: 'Chief People Officer',
      whyThem: 'Shapes the leadership process and candidate slate.',
    }]} />)

    expect(html).toContain('People to know')
    expect(html).toContain('Chief People Officer')
    expect(html).toContain('Find on LinkedIn')
    expect(html).toContain('Open in your Apollo account')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Their contact details stay theirs')
    expect(html).not.toMatch(/email|phone/i)
  })

  it('renders nothing without eligible entries', () => {
    expect(renderToStaticMarkup(<PeopleToKnowSection entries={[]} />)).toBe('')
  })
})