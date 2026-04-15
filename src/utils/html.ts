/**
 * Escapes special HTML characters in a string to prevent HTML injection.
 * Use when interpolating user-provided content into an HTML string.
 */
export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
