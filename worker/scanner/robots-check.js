import { safeFetch } from '../lib/safe-fetch.js';

const MAX_ROBOTS_BYTES = 512 * 1024;

// Returns true if scanning the given URL is permitted by robots.txt
export async function isAllowedByRobots(pageUrl) {
  try {
    const { protocol, host } = new URL(pageUrl);
    const robotsUrl = `${protocol}//${host}/robots.txt`;

    // The career page URL is user-supplied: resolve, pin and re-check every
    // redirect (P1-5).
    const res = await safeFetch(robotsUrl, {
      headers: { 'User-Agent': 'StartingMondayBot/1.0' },
      timeoutMs: 5000,
      maxBytes: MAX_ROBOTS_BYTES,
    });

    if (!res.ok) return true; // No robots.txt = allowed

    const text = await res.text();
    return !isDisallowed(text, pageUrl);
  } catch {
    // Network error fetching robots.txt — don't block the scan. An unsafe
    // (private/reserved) host lands here too; fetchPage refuses it itself.
    return true;
  }
}

function isDisallowed(robotsTxt, url) {
  const path = new URL(url).pathname;
  const lines = robotsTxt.split('\n').map(l => l.split('#')[0].trim());

  let applicable = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('user-agent:')) {
      const agent = line.slice('user-agent:'.length).trim();
      applicable = agent === '*' || agent.toLowerCase() === 'startingmondaybot';
    } else if (applicable && lower.startsWith('disallow:')) {
      const disallowPath = line.slice('disallow:'.length).trim();
      if (disallowPath && path.startsWith(disallowPath)) return true;
    }
  }

  return false;
}
