/**
 * Removes all hashtags in the given space-separated string from a caption.
 *
 * This is the counterpart to `appendHashtagToCaption`. It strips each hashtag
 * from the caption text and cleans up any trailing whitespace / extra blank lines
 * that were left behind.
 *
 * @param caption  - The current caption text.
 * @param hashtags - Space-separated hashtags to remove (e.g. "#tag1 #tag2").
 * @returns The updated caption with the hashtags removed.
 *
 * @example
 * removeHashtagsFromCaption('Hello world\n\n#marketing #design', '#marketing #design')
 * // → 'Hello world'
 *
 * removeHashtagsFromCaption('Hello world\n\n#marketing #design', '#marketing')
 * // → 'Hello world\n\n#design'
 */
export function removeHashtagsFromCaption(caption: string, hashtags: string): string {
  const tags = hashtags
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`));

  let result = caption;
  for (const tag of tags) {
    // Remove the tag whether it appears with a leading space, at the start, or after a newline.
    result = result.replace(new RegExp(`(?:^|\\s)${escapeRegex(tag)}(?=\\s|$)`, 'gi'), '');
  }

  // Collapse runs of 3+ newlines down to 2 and trim trailing whitespace.
  return result.replace(/\n{3,}/g, '\n\n').trimEnd();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
