# Hashtag Pool Create Popover — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `#` icon in `CalendarPostModal` to a compact, reusable popover for creating hashtag pools, using the same entity flow as the Hashtag Manager page.

**Architecture:** A new `HashtagPoolCreatePopover` component owns all form state and the create mutation internally. It is placed in the toolbar via a `trigger` slot so the modal controls the button style. On success it invalidates `['hashtag-pool']`, which React Query propagates to every consumer automatically — the pool selector and the Hashtag Manager page both update without a page refresh.

**Tech Stack:** React 18, TypeScript, @tanstack/react-query v5, shadcn/ui (`Popover`, `Input`, `Textarea`, `Button`), Lucide icons, base44 SDK

---

## File Map

| Action     | Path                                                   | Responsibility                               |
| ---------- | ------------------------------------------------------ | -------------------------------------------- |
| **Create** | `src/components/hashtags/HashtagPoolCreatePopover.tsx` | Self-contained create-pool popover component |
| **Modify** | `src/components/modals/CalendarPostModal.jsx`          | Wire `#` button to new component             |

---

## Task 1: Create `HashtagPoolCreatePopover.tsx`

**Files:**

- Create: `src/components/hashtags/HashtagPoolCreatePopover.tsx`

No test framework exists in this project — verification is manual (dev server).

- [ ] **Step 1: Create the file with the full component**

Create `src/components/hashtags/HashtagPoolCreatePopover.tsx` with this exact content:

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, ChevronDown, Star } from 'lucide-react';
import COPY from '@/lib/copy';
import type { HashtagPool } from '@/types/hashtags';
import { normalizeCategoryName, splitCategories } from '@/utils/hashtags';

interface HashtagPoolCreatePopoverProps {
  /** Rendered as PopoverTrigger asChild — the caller controls the button style */
  trigger: React.ReactNode;
  /** Pass dialogContentRef.current when used inside a Dialog to avoid z-index issues */
  container?: HTMLElement | null;
  /** Forward to PopoverContent to prevent accidental close (e.g. caption focus guard) */
  onFocusOutside?: (event: Event) => void;
}

export function HashtagPoolCreatePopover({
  trigger,
  container,
  onFocusOutside,
}: HashtagPoolCreatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [poolHashtags, setPoolHashtags] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [pendingNewCategory, setPendingNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: pools = [] } = useQuery<HashtagPool[]>({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<HashtagPool, 'id'>) => base44.entities.HashtagPool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setPoolName('');
      setPoolHashtags('');
      setCategories([]);
      setIsFavorite(false);
      setShowNewCategoryInput(false);
      setPendingNewCategory('');
      setLocalCategories([]);
      setOpen(false);
    },
  });

  const existingCategories = [...new Set(pools.flatMap((p) => splitCategories(p.category)))];
  const allCategories = [...new Set([...existingCategories, ...localCategories])];

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const confirmNewCategory = () => {
    const name = normalizeCategoryName(pendingNewCategory);
    if (!name) return;
    setLocalCategories((prev) => [...new Set([...prev, name])]);
    setCategories((prev) => [...new Set([...prev, name])]);
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
  };

  const handleAdd = () => {
    if (!poolName.trim() || !poolHashtags.trim()) return;
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
    const normalizedHashtags = poolHashtags
      .trim()
      .split(/\s+/)
      .map((w) => (w.startsWith('#') ? w : `#${w}`))
      .join(' ');
    mutation.mutate({
      hashtag: poolName.trim().replace(/^#+/, ''),
      category: categories.join(' | ') || null,
      hashtags: normalizedHashtags,
      is_favorite: isFavorite,
      usage_count: 0,
    });
  };

  const hasSelections = isFavorite || categories.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        container={container}
        align="start"
        side="top"
        className="w-80 p-3"
        onFocusOutside={onFocusOutside}
      >
        <p className="text-sm font-semibold mb-3">{COPY.hashtagManager.createPoolTitle}</p>

        {/* Name + Category row */}
        <div className="flex gap-2 mb-2">
          <div className="flex-[3]">
            <Input
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              placeholder="Pool name..."
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-[2]">
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <button className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm">
                  {!hasSelections ? (
                    <span className="text-muted-foreground text-xs truncate">Category...</span>
                  ) : (
                    <span className="flex flex-wrap gap-0.5 overflow-hidden">
                      {isFavorite && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1 py-0.5 rounded">
                          ★
                        </span>
                      )}
                      {categories.map((cat) => (
                        <span
                          key={cat}
                          className="bg-violet-100 text-violet-700 text-xs px-1 py-0.5 rounded capitalize"
                        >
                          {cat}
                        </span>
                      ))}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-1" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                {/* Favorites */}
                <button
                  onClick={() => setIsFavorite((prev) => !prev)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      isFavorite ? 'bg-amber-500 border-amber-500 text-white' : 'border-input'
                    }`}
                  >
                    {isFavorite && <Check className="h-3 w-3" />}
                  </span>
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {COPY.hashtagManager.addToFavorites}
                </button>

                {allCategories.length > 0 && <div className="border-t my-1" />}

                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent capitalize"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        categories.includes(cat)
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-input'
                      }`}
                    >
                      {categories.includes(cat) && <Check className="h-3 w-3" />}
                    </span>
                    {cat}
                  </button>
                ))}

                <div className="border-t mt-1 pt-1">
                  <button
                    onClick={() => setShowNewCategoryInput(true)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-violet-600 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    {COPY.hashtagManager.newCategory}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* New category inline input */}
        {showNewCategoryInput && (
          <div className="flex gap-1.5 mb-2">
            <Input
              value={pendingNewCategory}
              onChange={(e) => setPendingNewCategory(e.target.value)}
              placeholder="New category name..."
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewCategory();
                if (e.key === 'Escape') {
                  setShowNewCategoryInput(false);
                  setPendingNewCategory('');
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={confirmNewCategory}
              className="h-8 bg-violet-600 hover:bg-violet-700"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setShowNewCategoryInput(false);
                setPendingNewCategory('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Hashtags textarea */}
        <Textarea
          value={poolHashtags}
          onChange={(e) => setPoolHashtags(e.target.value)}
          placeholder={COPY.hashtagManager.hashtagsPlaceholder}
          rows={3}
          className="text-sm mb-2"
        />

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleAdd}
            disabled={!poolName.trim() || !poolHashtags.trim() || mutation.isPending}
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-3.5 h-3.5" />
            {COPY.hashtagManager.addPool}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Run typecheck to verify no TS errors**

```bash
npm run typecheck
```

Expected: No errors in `src/components/hashtags/HashtagPoolCreatePopover.tsx`.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No new errors or warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/hashtags/HashtagPoolCreatePopover.tsx
git commit -m "feat: add HashtagPoolCreatePopover compact create form"
```

---

## Task 2: Wire `#` button in `CalendarPostModal.jsx`

**Files:**

- Modify: `src/components/modals/CalendarPostModal.jsx` (lines ~1–67 for import, ~1323 for button)

- [ ] **Step 1: Add the import**

In `src/components/modals/CalendarPostModal.jsx`, after the existing import block (around line 66, after `import { Label } from '@/components/ui/label';`), add:

```js
import { HashtagPoolCreatePopover } from '@/components/hashtags/HashtagPoolCreatePopover';
```

- [ ] **Step 2: Replace the bare `#` button**

Find this block (around line 1323):

```jsx
<button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
  <Hash className="w-5 h-5" />
</button>
```

Replace it with:

```jsx
<HashtagPoolCreatePopover
  trigger={
    <button
      type="button"
      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <Hash className="w-5 h-5" />
    </button>
  }
  container={dialogContentRef.current}
  onFocusOutside={(event) => {
    if (event.target === captionRef.current) {
      event.preventDefault();
    }
  }}
/>
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: No new errors or warnings.

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/CalendarPostModal.jsx
git commit -m "feat: wire # toolbar button to HashtagPoolCreatePopover"
```

---

## Task 3: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`.

- [ ] **Step 2: Verify # button toggles the popover**

Open `CalendarPostModal` (create or edit a post via the calendar). Click the `#` icon in the bottom-left toolbar (immediately right of the emoji icon). Expected: A compact white popover appears anchored to the button with title "Create New Hashtag Pool", name input, category dropdown, hashtags textarea, and purple `+ Add` button.

Click `#` again or click outside the popover. Expected: Popover closes.

- [ ] **Step 3: Verify the emoji picker still works**

With the modal open, click the emoji (😊) icon. Expected: Emoji picker opens. Click outside it. Expected: It closes. Click the `#` icon. Expected: The hashtag popover opens (not the emoji picker). The two popovers must not interfere.

- [ ] **Step 4: Verify create flow**

In the hashtag popover:

1. Enter a pool name, e.g. `TestPool`
2. Enter some hashtags, e.g. `testing dev`
3. Click `+ Add`

Expected:

- Popover closes
- The new pool `TestPool` appears in the hashtag pool pill selector below the caption textarea
- Navigate to the Hashtag Manager page — `TestPool` appears there too

- [ ] **Step 5: Verify category dropdown**

Open the popover again. Click the category dropdown. Expected: "Add to Favorites" option plus any existing categories appear. Click "New Category", type a name, press Enter. Expected: The new category is added and selected. It appears in the pill selector on the trigger button.

- [ ] **Step 6: Verify caption focus is not broken**

Click inside the caption textarea to focus it. Click the `#` icon. Expected: The popover opens without blurring the caption. Click outside the popover (but not on the caption). Expected: Popover closes. Caption focus state should be preserved / the caption should not jump unexpectedly.

- [ ] **Step 7: Final lint + typecheck**

```bash
npm run lint && npm run typecheck
```

Expected: Both pass with no errors.
