export const splitCategories = (category: string | null | undefined): string[] =>
  category
    ? category
        .split(' | ')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];

export const normalizeCategoryName = (value: string): string => value.trim().toLowerCase();
