// Only allow URL schemes that are safe to render as a clickable link.
// Blocks javascript:, data:, vbscript:, etc., which would otherwise let a tutor
// store a link that runs script when a student clicks it (stored XSS).
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:'];

// Returns a safe absolute URL, or '' if the value can't be trusted.
// Scheme-relative and path-relative URLs are treated as https for parsing.
export function safeUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed, 'https://placeholder.local');
    if (!SAFE_SCHEMES.includes(url.protocol)) return '';
    return trimmed;
  } catch {
    return '';
  }
}

// Sanitize an array of {url,...} link objects, dropping any with an unsafe URL.
export function sanitizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((l) => ({ ...l, url: safeUrl(l?.url) }))
    .filter((l) => l.url);
}
