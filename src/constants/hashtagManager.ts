export const CATEGORY_FILTER = {
  ALL: 'all',
  UNCATEGORIZED: 'uncategorized',
  FAVORITES: 'favorites',
} as const;

export type CategoryFilter = (typeof CATEGORY_FILTER)[keyof typeof CATEGORY_FILTER];
