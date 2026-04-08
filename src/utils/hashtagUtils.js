// Utility to check if two arrays are equal (shallow comparison, order-sensitive).
// Use this for ordered sequences like platforms and hashtags.
export const arraysEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

// Utility to check if two arrays contain the same set of values, regardless of order.
// Use this for ID arrays (e.g. tag_ids) whose server-returned order is not guaranteed.
export const setsEqual = (left = [], right = []) => {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
};

// Normalize a hashtag: remove leading #, trim, and lowercase
export const normalizeHashtag = (tag) => tag.replace(/^#/, '').trim().toLowerCase();

// Extract hashtags from a string, normalized
export const extractHashtags = (value = '') =>
  Array.from(value.matchAll(/#([A-Za-z0-9_]+)/g), (match) => normalizeHashtag(match[1]));
