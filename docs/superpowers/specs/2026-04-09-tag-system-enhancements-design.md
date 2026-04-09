# Tag System Enhancements — Design Spec

**Date:** 2026-04-09
**Branch:** feat/2120-calendar-filtering (or a new branch from main)
**Scope:** Industry-standard tag improvements — inline color picker, archive with drag-to-tab, usage count, duplicate guard, filter persistence

---

## Background

The tag system is functional but missing several standard behaviors that users expect. This spec covers the five in-scope improvements identified in the post-PR#66 review:

1. Color picker at inline tag creation
2. Archive/unarchive with tab UI and drag-to-tab
3. Usage count on the management page
4. Duplicate name guard
5. Tag filter URL persistence

**Out of scope (deferred):** bulk tag operations on posts, rename with post-history tracking.

---

## Architecture

Four surfaces change. No new pages or routes.

| File | What changes |
|---|---|
| `src/components/social/tags/TagSelector.tsx` | Inline create expands into color-picker panel before submitting |
| `src/pages/SocialTags.jsx` | Active/Archived tabs, drag-to-archive via dnd-kit, usage count, duplicate guard |
| `src/constants/tags.ts` | New file — `TAG_COLORS` extracted here and shared by both surfaces |
| `src/pages/SocialCalendar.jsx` | Tag filter uses `useSearchParams` instead of `useState` |
| `src/lib/copy.ts` | New strings for archive actions and duplicate name error |

---

## 1. Shared Tag Colors Constant

Extract `TAG_COLORS` from `SocialTags.jsx` into `src/constants/tags.ts`:

```ts
export const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#64748b', '#000000',
];
```

Both `TagSelector.tsx` and `SocialTags.jsx` import from here. Removes the current duplication.

---

## 2. TagSelector — Inline Create with Color Picker

### Current behavior
Typing a new name and clicking "Create tag" immediately creates the tag with the default color (`#6366f1`).

### New behavior
Clicking "Create tag" **expands a panel** below the row instead of creating immediately. The panel contains:
- A "Color" label
- Preset swatches from `TAG_COLORS` (20×20px circles)
- A rainbow swatch that opens `input[type=color]` (native browser picker). When a custom color is picked, the rainbow swatch is replaced with a circle showing that hex value and it becomes selected.
- A hex label showing the active color
- A **Create** button (background tinted to the selected color) that fires the create mutation

A live tag preview pill (name + selected color) appears above the swatch row, updating as the color changes.

### State
- `createColor: string` — local state in `TagSelector`, defaults to `TAG_COLORS[0]`
- `isCreateExpanded: boolean` — whether the panel is open
- Resets to defaults when the popover closes, after successful create, or when the search input is cleared

### `handleCreate` change
Accepts `color: string`. Calls `createTag({ name, color })`. On success, collapses the panel and clears search.

### `useCreateTagMutation` change
`mutationFn` already accepts a name string — extend the input type to `{ name: string; color?: string }` and include `color` in the payload.

---

## 3. SocialTags Page

### 3a. Active / Archived Tabs

Replace the current single list with two tabs: **Active** and **Archived**. Each tab header shows a count badge with the number of tags in that state.

- Tab state: `activeTab: 'active' | 'archived'` via `useState`
- Active list: `tags.filter(t => !t.is_archived)`
- Archived list: `tags.filter(t => t.is_archived)`
- The existing "New Tag" button is only shown on the Active tab

### 3b. Drag-to-Archive / Unarchive

Use `@dnd-kit/core` (already installed). The implementation uses the `useDraggable` and `useDroppable` hooks.

**Draggable:** Each tag row is wrapped with `useDraggable`. A drag handle icon (⠿) appears on row hover. The row is dimmed (`opacity-40`) while `isDragging` is true. Drag data: `{ tagId, currentTab }`.

**Droppable:** Each tab header is wrapped with `useDroppable` with id `'active'` or `'archived'`. The tab glows amber (`bg-amber-50 border-amber-300`) while a draggable hovers over it during a drag.

**On drop:**
1. If dropped tab === current tab, do nothing.
2. Call `SocialTag.update(tagId, { is_archived: droppedOnArchived })`.
3. Invalidate `['social-tags']`.
4. Switch `activeTab` to the destination tab.
5. Show a Sonner toast: `"campaign archived"` / `"campaign unarchived"`.

Wrap the page content in `<DndContext onDragEnd={handleDragEnd}>`.

### 3c. Usage Count

Each tag row shows post count as `"X posts"` using `tag.usage_count` from the entity directly. Renders as a small muted label on the right side of each row, before the action buttons.

If `usage_count` is `undefined` or `null`, render nothing (don't show "0 posts" for tags where the count hasn't been computed yet).

### 3d. Duplicate Name Guard

In `TagFormModal`, on save:
1. Normalise the input: `name.trim().toLowerCase()`
2. Check the `['social-tags']` React Query cache for any tag with the same normalised name, excluding the tag being edited (if in edit mode).
3. If a duplicate is found, set an inline field error (`"A tag with this name already exists."`) and block the save. No API call.

Use `useQueryClient().getQueryData<TagOption[]>(['social-tags'])` inside the modal to read the cache without triggering a refetch.

---

## 4. Tag Filter URL Persistence

In `SocialCalendar.jsx`, replace the tag filter `useState` with `useSearchParams` from React Router v6.

- Read: `searchParams.get('tag') ?? ''`
- Write: `setSearchParams(p => { p.set('tag', id); return p; })` / `p.delete('tag')` when cleared
- Existing filter logic (filtering `filteredPosts`) is unchanged — only the source of the active tag ID changes

This means sharing a filtered calendar URL works automatically.

---

## 5. Copy Strings

Add to `src/lib/copy.ts` under `tagSelector` and a new `socialTags` key:

```ts
tagSelector: {
  // ...existing...
  colorLabel: 'Color',
  createWithColor: 'Create',
},
socialTags: {
  activeTab: 'Active',
  archivedTab: 'Archived',
  archiveSuccess: (name: string) => `"${name}" archived`,
  unarchiveSuccess: (name: string) => `"${name}" unarchived`,
  duplicateNameError: 'A tag with this name already exists.',
  postCount: (n: number) => `${n} post${n === 1 ? '' : 's'}`,
},
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| Archive/unarchive API failure | Sonner `toast.error`, query not invalidated (tag stays in current tab) |
| Inline create with color failure | Existing `createError` toast, panel stays open |
| Duplicate name | Inline field error in modal, save blocked |
| Filter param with invalid tag ID | Filter silently ignored (no matching posts shown, URL param preserved) |

---

## Constraints

- `@dnd-kit/core` is already installed — no new dependencies
- `input[type=color]` is used for the custom color picker — no extra library
- `usage_count` is read directly from the entity — no additional query
- All drag-to-archive mutations go through the existing `['social-tags']` cache invalidation pattern
