/**
 * Appends a hashtag to a social media caption with correct formatting.
 *
 * Formatting rules:
 * - Duplicate hashtags are ignored (returns `null` so the caller can bail out early).
 * - When the caption is empty, the hashtag is placed directly with no prefix.
 * - When adding the **first** hashtag to a non-empty caption, a blank line is inserted
 *   between the body text and the hashtag block.
 * - **Subsequent** hashtags are appended with a single space to avoid extra blank lines.
 *
 * @param caption          - The current caption text.
 * @param hashtag          - The hashtag to add (with or without a leading `#`).
 * @param existingHashtags - Hashtags already tracked in form state (without `#`). Defaults to [].
 * @returns An object `{ caption, hashtags }` with the updated values,
 *          or `null` if the hashtag was already present or is empty (no-op).
 *
 * @example
 * appendHashtagToCaption('Hello world', 'marketing', [])
 * // → { caption: 'Hello world\n\n#marketing', hashtags: ['marketing'] }
 *
 * appendHashtagToCaption('Hello world\n\n#marketing', 'design', ['marketing'])
 * // → { caption: 'Hello world\n\n#marketing #design', hashtags: ['marketing', 'design'] }
 *
 * appendHashtagToCaption('Hello world\n\n#marketing', 'marketing', ['marketing'])
 * // → null  (duplicate, no-op)
 */
export function appendHashtagToCaption(
  caption: string,
  hashtag: string,
  existingHashtags: string[] = []
): { caption: string; hashtags: string[] } | null {
  const clean = hashtag.replace(/^#/, '').trim();
  if (!clean) return null;
  if (existingHashtags.includes(clean)) return null;

  const updatedHashtags = [...existingHashtags, clean];
  const trimmedCaption = caption.replace(/\s*$/, '');

  let newCaption: string;
  if (!trimmedCaption) {
    newCaption = `#${clean}`;
  } else if (existingHashtags.length === 0) {
    // First hashtag after body text — separate with a blank line.
    newCaption = `${trimmedCaption}\n\n#${clean}`;
  } else {
    // Subsequent hashtags — space-separated to keep them in one block.
    newCaption = `${trimmedCaption} #${clean}`;
  }

  return { caption: newCaption, hashtags: updatedHashtags };
}
