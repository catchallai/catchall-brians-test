import COPY from '@/lib/copy';

type LabelablePost = {
  title?: string | null;
  caption?: string | null;
};

type Options = {
  maxLen: number;
  preferTitle?: boolean;
};

/**
 * Returns a display label for a calendar post card.
 *
 * Prefers `caption` by default since `title` is optional in the schema and rarely set —
 * the calendar should show meaningful content rather than "Untitled" whenever a caption
 * exists. Pass `preferTitle: true` for surfaces where a title (when present) makes a
 * better header (e.g., the hover popover, where the full caption is rendered separately).
 *
 * Falls back to `COPY.socialCalendar.untitled` only when both fields are empty.
 *
 * @example
 * getPostCardLabel({ caption: 'Hello world' }, { maxLen: 20 })
 * // → 'Hello world'
 *
 * getPostCardLabel({ title: 'Launch Day', caption: 'A long caption...' }, { maxLen: 30, preferTitle: true })
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
  return source.length > maxLen ? source.slice(0, maxLen) : source;
}
