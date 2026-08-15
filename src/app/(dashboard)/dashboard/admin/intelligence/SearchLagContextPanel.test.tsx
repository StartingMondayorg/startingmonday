import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SearchLagContextPanel } from './SearchLagContextPanel'

describe('SearchLagContextPanel', () => {
  it('renders supported role context with evidence bounds', () => {
    const html = renderToStaticMarkup(
      <SearchLagContextPanel
        companyCohortCount={0}
        lastUpdatedAt="2026-08-13T04:00:00.000Z"
        roleStats={[{
          title_normalized: 'CIO',
          median_search_lag_days: 95,
          p25_search_lag_days: 3,
          p75_search_lag_days: 245,
          sample_size: 249,
        }]}
      />,
    )

    expect(html).toContain('Ready')
    expect(html).toContain('CIO: median 95 days')
    expect(html).toContain('middle 50% 3–245')
    expect(html).toContain('(n=249)')
    expect(html).toContain('Last refreshed 2026-08-13')
  })

  it('renders a bounded no-data state without unsupported context', () => {
    const html = renderToStaticMarkup(
      <SearchLagContextPanel roleStats={[]} companyCohortCount={0} lastUpdatedAt={null} />,
    )

    expect(html).toContain('Building support')
    expect(html).toContain('No supported role cohort yet')
    expect(html).toContain('Unsupported cohorts are withheld')
  })
})