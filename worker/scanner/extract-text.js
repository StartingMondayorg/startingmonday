import * as cheerio from 'cheerio';

const MAX_CHARS = 50_000;

// Elements that render as visual blocks. Emitting a line break at each of these
// boundaries makes extraction independent of source whitespace: a minified or
// serialized-DOM page (browserless /chromium/content output has no newlines
// between elements) still yields one line per visual block, so detect-roles.js
// can read it. Relying on whitespace that happened to exist in the markup is
// the SMK-489 failure class: rendered pages collapsed into one giant line and
// silently scored zero.
const BLOCK_SELECTOR = [
  'address', 'article', 'aside', 'blockquote', 'dd', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre',
  'section', 'table', 'td', 'th', 'tr', 'ul',
].join(', ');

// Strips HTML noise and returns clean plain text suitable for role detection.
// Output contract: one line per visual block, regardless of how the source
// markup was formatted (minified, pretty-printed, or serialized DOM).
export function extractText(html) {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    'script, style, noscript, iframe, svg, img, video, audio, ' +
    'nav, header, footer, ' +
    '[role="navigation"], [role="banner"], [role="contentinfo"], [role="search"]'
  ).remove();

  // Remove common noise by class/id patterns
  $('[class*="cookie"], [class*="banner"], [class*="popup"], [class*="modal"], ' +
    '[class*="newsletter"], [class*="chat"], [id*="chat"], ' +
    '[aria-hidden="true"]').remove();

  // Explicit line breaks first, then a break at every block boundary.
  $('br').replaceWith('\n');
  $(BLOCK_SELECTOR).each((_, el) => {
    $(el).append('\n');
  });

  return normalizeText($('body').text());
}

// Normalizes already-plain text (browser innerText, ATS feed text, or the raw
// cheerio output above): trims each line, drops empties, caps total size.
export function normalizeText(text) {
  return String(text ?? '')
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0)
    .join('\n')
    .slice(0, MAX_CHARS);
}

// Shape stats for one scan's extracted text. Persisted per scan (SMK-489 item 4)
// so the collapsed-extraction failure class stays permanently measurable.
export function textShape(text) {
  const s = String(text ?? '');
  if (s.length === 0) return { chars: 0, lineCount: 0, maxLineChars: 0 };
  let lineCount = 0;
  let maxLineChars = 0;
  for (const line of s.split('\n')) {
    lineCount += 1;
    if (line.length > maxLineChars) maxLineChars = line.length;
  }
  return { chars: s.length, lineCount, maxLineChars };
}

// A page with this much text where one line carries nearly all of it did not
// extract, it collapsed. detect-roles.js cannot read any line over 120 chars,
// so a dominant multi-hundred-char line means the scan saw content but could
// not parse it. Such scans must never be recorded as an authoritative zero
// (SMK-489 item 3).
export const DEGENERATE_MIN_CHARS = 800;
export const DEGENERATE_DOMINANT_LINE_RATIO = 0.9;

export function isDegenerateTextShape(shape) {
  if (!shape || shape.chars < DEGENERATE_MIN_CHARS) return false;
  return shape.maxLineChars >= shape.chars * DEGENERATE_DOMINANT_LINE_RATIO;
}
