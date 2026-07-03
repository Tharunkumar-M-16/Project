// Client-side guard for rendering user-supplied URLs. The server sanitizes on
// write, but this defends against any legacy/unsafe URL already in the data and
// keeps javascript:/data: links from ever becoming a clickable href.
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:'];

export function safeUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed, window.location.origin);
    return SAFE_SCHEMES.includes(url.protocol) ? trimmed : '';
  } catch {
    return '';
  }
}
