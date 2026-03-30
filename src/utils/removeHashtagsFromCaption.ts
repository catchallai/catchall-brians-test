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
    result = result.replace(new RegExp(`${escapeRegex(tag)}(?=\\s|$)`, 'gi'), '');
  }

  const lines = result.split('\n');
  const lastLine = lines[lines.length - 1] ?? '';
  const remainingHashtags = lastLine.split(/\s+/).filter((t) => t.startsWith('#'));

  if (remainingHashtags.length > 0) {
    const body = lines
      .slice(0, -1)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+$/, '');
    const normalizedHashtagLine = remainingHashtags.join(' ');
    return body ? `${body}\n\n${normalizedHashtagLine}` : normalizedHashtagLine;
  }

  // No hashtags remain; collapse runs of 3+ newlines down to 2 and trim trailing whitespace.
  return result.replace(/\n{3,}/g, '\n\n').trimEnd();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
