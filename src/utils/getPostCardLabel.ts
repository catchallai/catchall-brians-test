import COPY from '@/lib/copy';

type LabelablePost = {
  title?: string | null;
  caption?: string | null;
};

type Options = {
  maxLen: number;
  preferTitle?: boolean;
};

const ELLIPSIS = '…';

// Cached segmenter — grapheme-aware so we don't slice mid-emoji or split surrogate pairs.
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function truncate(text: string, maxLen: number): string {
  const graphemes = Array.from(segmenter.segment(text), (s) => s.segment);
  if (graphemes.length <= maxLen) return text;
  // Reserve one grapheme of budget for the ellipsis so the visible length stays ≤ maxLen.
  const head = graphemes.slice(0, Math.max(maxLen - 1, 1)).join('');
  return head + ELLIPSIS;
}

/**
 * Returns a display label for a calendar post card.
 *
 * Prefers `caption` by default since `title` is optional in the schema and rarely set —
 * the calendar should show meaningful content rather than "Untitled" whenever a caption
 * exists. Pass `preferTitle: true` for surfaces where a title (when present) makes a
 * better header (e.g., the hover popover, where the full caption is rendered separately).
 *
 * Truncated output ends with a "…" so the cut is visible even on surfaces that lack
 * CSS `truncate`/`line-clamp`. Truncation is grapheme-aware via `Intl.Segmenter`, so
 * emoji and surrogate pairs aren't split. The ellipsis counts toward `maxLen`.
 *
 * Falls back to `COPY.socialCalendar.untitled` only when both fields are empty.
 *
 * @example
 * getPostCardLabel({ caption: 'Hello world' }, { maxLen: 20 })
 * // → 'Hello world'
 *
 * getPostCardLabel({ caption: 'A much longer caption than fits' }, { maxLen: 20 })
 * // → 'A much longer capti…'
 *
 * getPostCardLabel({ title: 'Launch Day', caption: 'A long caption…' }, { maxLen: 30, preferTitle: true })
 * // → 'Launch Day'
 *
 * getPostCardLabel({}, { maxLen: 20 })
 * // → 'Untitled'
 */
export function getPostCardLabel(
  post: LabelablePost,
  { maxLen, preferTitle = false }: Options
): string {
  const title = post.title?.trim();
  const caption = post.caption?.trim();
  const primary = preferTitle ? title : caption;
  const secondary = preferTitle ? caption : title;
  const source = primary || secondary;
  if (!source) return COPY.socialCalendar.untitled;
  return truncate(source, maxLen);
}
