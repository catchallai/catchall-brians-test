# Hashtag Pool Create Popover — Design Spec

**Date:** 2026-03-31  
**Status:** Approved

---

## Overview

Add a functional `#` icon to the `CalendarPostModal` toolbar that opens a compact, dropdown-style popover for creating a new hashtag pool. The flow must be identical to creating a pool via the Hashtag Manager page so that a pool created from the modal appears everywhere immediately.

---

## Scope

- **New file:** `src/components/hashtags/HashtagPoolCreatePopover.tsx`
- **Modified file:** `src/components/modals/CalendarPostModal.jsx`
- **No changes to:** `CreateHashtagPoolSection.tsx`, `HashtagPoolSelector.tsx`, parent pages, query patterns, entity schema

---

## New Component: `HashtagPoolCreatePopover`

### Location

`src/components/hashtags/HashtagPoolCreatePopover.tsx`

### Props

```ts
interface HashtagPoolCreatePopoverProps {
  /** The trigger element — rendered via PopoverTrigger asChild */
  trigger: ReactNode;
  /** For rendering inside a Dialog (avoids z-index issues) */
  container?: HTMLElement | null;
  /** Forwarded to PopoverContent.onFocusOutside (e.g. caption focus guard) */
  onFocusOutside?: (event: Event) => void;
}
```

### Internal State

| State                  | Type       | Purpose                                           |
| ---------------------- | ---------- | ------------------------------------------------- |
| `open`                 | `boolean`  | Controls popover visibility                       |
| `poolName`             | `string`   | Name field value                                  |
| `poolHashtags`         | `string`   | Hashtags textarea value                           |
| `categories`           | `string[]` | Selected categories                               |
| `isFavorite`           | `boolean`  | Favorite toggle                                   |
| `showNewCategoryInput` | `boolean`  | Shows inline new-category input                   |
| `pendingNewCategory`   | `string`   | New category input value                          |
| `localCategories`      | `string[]` | Categories added this session (not yet in a pool) |

### Data

- **Read:** `useQuery(['hashtag-pool'])` — cached, no extra network call; derives `allCategories` from existing pool entries
- **Write:** `useMutation` → `base44.entities.HashtagPool.create(data)`
- **On success:** `queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] })`, reset all form state, set `open = false`

### Create Logic (identical to `CreateHashtagPoolSection`)

```ts
const normalizedHashtags = poolHashtags
  .trim()
  .split(/\s+/)
  .map((w) => (w.startsWith('#') ? w : `#${w}`))
  .join(' ');

base44.entities.HashtagPool.create({
  hashtag: poolName.trim().replace(/^#+/, ''),
  category: categories.join(' | ') || null,
  hashtags: normalizedHashtags,
  is_favorite: isFavorite,
  usage_count: 0,
});
```

Guard: disabled if `poolName.trim()` or `poolHashtags.trim()` is empty, or mutation is pending.

### UI Layout (compact)

```
┌──────────────────────────────────────┐
│ Create New Hashtag Pool              │  ← small heading (text-sm font-semibold)
├──────────────────────────────────────┤
│ [Pool name input     ] [Category ▾ ] │  ← flex row, name flex-[3], category flex-[2]
│ [New category input + Add | Cancel]  │  ← only shown when showNewCategoryInput=true
│ [Hashtags textarea                 ] │  ← rows={3}
│                          [+ Add    ] │  ← purple button, aligned bottom-right
└──────────────────────────────────────┘
```

- Width: `w-80` (320px)
- Background: white, rounded, shadow
- Category dropdown: same Popover-within-Popover pattern as `CreateHashtagPoolSection` (Favorites + existing categories + "+ New Category" footer)
- Favorite toggle: star checkbox same as `CreateHashtagPoolSection`
- `+ Add` button: `bg-violet-600 hover:bg-violet-700`
- Title pulled from `COPY.hashtagManager.createPoolTitle`

---

## Changes to `CalendarPostModal.jsx`

### 1. Import

```js
import { HashtagPoolCreatePopover } from '@/components/hashtags/HashtagPoolCreatePopover';
```

### 2. Replace the bare `#` button

**Before (line ~1323):**

```jsx
<button className="p-1.5 text-gray-400 hover:text-gray-700 ... rounded-lg transition-colors">
  <Hash className="w-5 h-5" />
</button>
```

**After:**

```jsx
<HashtagPoolCreatePopover
  trigger={
    <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <Hash className="w-5 h-5" />
    </button>
  }
  container={dialogContentRef.current}
  onFocusOutside={(e) => {
    if (e.target === captionRef.current) e.preventDefault();
  }}
/>
```

No other changes to `CalendarPostModal.jsx`.

---

## Data Flow

```
User clicks # → HashtagPoolCreatePopover opens
User fills form → clicks "+ Add"
  → base44.entities.HashtagPool.create(...)
  → onSuccess: invalidate ['hashtag-pool']
    → SocialCalendar/AllChannels re-fetches hashtagPool
      → CalendarPostModal receives updated hashtagPool prop
        → HashtagPoolSelector shows new pool
      → HashtagManager page also shows new pool (same query key)
  → popover closes, form resets
```

---

## Constraints & Non-Goals

- Do not modify `CreateHashtagPoolSection.tsx` — no shared hook extraction needed at this scope
- Do not modify `HashtagPoolSelector.tsx`
- Do not add test files
- Keep `customCategories` as local-only state within the popover (no prop needed — the manager's cross-section sharing is not required here)
- Category dropdown renders inside the `Popover` via a nested `Popover` (same as `CreateHashtagPoolSection`)

---

## Acceptance Criteria

- [ ] `#` icon in `CalendarPostModal` toolbar toggles the create popover
- [ ] Clicking outside closes the popover
- [ ] Creating a pool succeeds and closes the popover
- [ ] `['hashtag-pool']` is invalidated on success
- [ ] Newly created pool appears immediately in `HashtagPoolSelector` without page refresh
- [ ] Newly created pool appears in Hashtag Manager
- [ ] No regression in emoji picker, caption focus, or existing hashtag pool selector behavior
- [ ] `HashtagPoolCreatePopover` is exported and reusable outside the modal
