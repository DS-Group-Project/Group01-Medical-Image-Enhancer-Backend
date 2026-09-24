/**
 * Input sanitization utilities — defense-in-depth for user-supplied text.
 *
 * React's JSX escaping handles the main XSS vector (text content), but
 * user input can still cause issues when used in URLs, data attributes,
 * or passed to third-party libraries. These utilities provide an extra
 * layer of safety.
 */

/**
 * Strips HTML tags from a string. Use for search queries, display names,
 * or any user text that should never contain markup.
 * @param {string} input
 * @returns {string}
 */
export function stripHtml(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validates and sanitizes a URL to prevent javascript: and data: protocol
 * injection. Returns null for unsafe URLs.
 * @param {string} url
 * @returns {string|null}
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  // Block javascript:, data:, vbscript: and other dangerous protocols
  if (/^\s*(javascript|data|vbscript|blob):/i.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    // Relative URLs are fine
    return trimmed;
  }
}

/**
 * Validates that a route parameter (like jobId) contains only safe
 * characters. Prevents path traversal and injection in URL construction.
 * @param {string} param
 * @returns {boolean}
 */
export function isValidRouteParam(param) {
  if (typeof param !== 'string') return false;
  // Allow alphanumeric, hyphens, underscores (typical for UUIDs and IDs)
  return /^[a-zA-Z0-9_-]+$/.test(param) && param.length <= 128;
}

/**
 * Sanitizes a search/filter query string. Strips control characters and
 * limits length to prevent abuse.
 * @param {string} query
 * @param {number} [maxLength=200]
 * @returns {string}
 */
export function sanitizeSearchQuery(query, maxLength = 200) {
  if (typeof query !== 'string') return '';
  // Remove control characters (U+0000–U+001F, U+007F–U+009F) and trim
  return query
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim()
    .slice(0, maxLength);
}
