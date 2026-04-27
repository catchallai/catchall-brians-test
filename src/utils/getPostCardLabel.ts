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
  if (maxLen <= 0) return '';
  // Fast path: char count is an upper bound on grapheme count. When chars fit the
  // budget, the string definitely fits without truncation, so we can skip the segmenter.
  if (text.length <= maxLen) return text;
  // Ellipsis fills a 1-grapheme budget on its own.
  if (maxLen === 1) return ELLIPSIS;
  // Reserve one grapheme of budget for the ellipsis so the visible length stays ≤ maxLen.
  const headLimit = maxLen - 1;
  let graphemeCount = 0;
  let head = '';
  for (const { segment } of segmenter.segment(text)) {
    graphemeCount += 1;
    if (graphemeCount <= headLimit) head += segment;
    if (graphemeCount > maxLen) return head + ELLIPSIS;
  }
  // Loop completed without exceeding the budget — total graphemes ≤ maxLen.
  return text;
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
