// Shared user-agent patterns for bot handling.
//
// Edge-safe on purpose: no Node built-ins, no imports. src/proxy.ts runs on the
// edge runtime and imports from here, so anything added to this file must stay
// dependency-free.
//
// Two patterns, two jobs, and the difference matters:
//
//   OBVIOUS_NON_BROWSER_UA is anchored at the start of the string and is used to
//   *block* requests on /api/optimize and /intelligence/*. Anchoring keeps it
//   narrow: a real browser agent string that merely contains "java" somewhere in
//   the middle must never be turned away.
//
//   SCRIPTED_USER_AGENT is unanchored and deliberately broader. It only ever
//   contributes to a bot *score* (SMK-467). Nothing is blocked on it, so a false
//   positive costs one misclassified row rather than a locked-out user.

/** Anchored. Safe to block on. Behavior preserved from the original proxy regex. */
export const OBVIOUS_NON_BROWSER_UA =
  /^(curl|python-requests|python-urllib|go-http|java\/|wget|scrapy|httpx|aiohttp|libwww-perl|okhttp|axios\/|node-fetch|python\/|go\/|ruby|perl|php\/|spider|crawler|bot\/|bot$|scraper|HeadlessChrome)/i

/** Unanchored and broader. Scoring only -- never block on this. */
export const SCRIPTED_USER_AGENT =
  /(bot\b|crawler|spider|slurp|curl\/|wget\/|python-requests|python-urllib|go-http-client|java\/|okhttp|axios\/|node-fetch|httpie|libwww|scrapy|headless|phantomjs|puppeteer|playwright|selenium)/i

/** Well-behaved crawlers and monitors. Recognised so they never trigger alerts. */
export const BENIGN_CRAWLER =
  /(googlebot|bingbot|slackbot|duckduckbot|applebot|linkedinbot|twitterbot|facebookexternalhit|ahrefsbot|semrushbot|uptimerobot|pingdom|betteruptime)/i

/**
 * The blocking predicate used by the proxy: no agent string at all, or one that
 * announces itself as a script from the first character.
 */
export function isObviousNonBrowser(userAgent: string | null | undefined): boolean {
  const ua = userAgent ?? ''
  return !ua || OBVIOUS_NON_BROWSER_UA.test(ua)
}
