export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function slugifyTag(name: string): string {
  return normalizeTagName(name)
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function coercePostTagIds(tagIds: unknown): string[] {
  if (!Array.isArray(tagIds)) {
    return [];
  }
  return tagIds.filter((item): item is string => typeof item === 'string');
}
