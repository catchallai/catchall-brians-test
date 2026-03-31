export const splitCategories = (category: string | null | undefined): string[] =>
  category
    ? category
        .split(' | ')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];

export const normalizeCategoryName = (value: string): string => value.trim().toLowerCase();

/** Toggle an item in/out of an array (immutable). */
export function toggleArrayItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

/** Normalize a whitespace-separated string of hashtag words, prepending # where missing. */
export function normalizeHashtagInput(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => (w.startsWith('#') ? w : `#${w}`))
    .join(' ');
}
