// Utility to check if two arrays are equal (shallow comparison)
export const arraysEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

// Normalize a hashtag: remove leading #, trim, and lowercase
export const normalizeHashtag = (tag) => tag.replace(/^#/, '').trim().toLowerCase();

// Extract hashtags from a string, normalized
export const extractHashtags = (value = '') =>
  Array.from(value.matchAll(/#([A-Za-z0-9_]+)/g), (match) => normalizeHashtag(match[1]));
