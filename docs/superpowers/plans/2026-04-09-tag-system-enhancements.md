# Tag System Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline color picker at tag creation, Active/Archived tabs with drag-to-archive on the Tags page, usage count per row, duplicate name guard, and tag filter URL persistence on the calendar.

**Architecture:** Seven self-contained tasks each producing a working commit. No new pages or routes. All drag behavior uses `@dnd-kit/core` (already installed). No test framework exists in this project — skip TDD steps; verify via `npm run lint && npm run typecheck` instead.

**Tech Stack:** React 18, TypeScript, TanStack Query v5, @dnd-kit/core v6, React Router v6, Tailwind CSS, Sonner toasts, shadcn/ui Command/Popover

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/constants/tags.ts` | **Create** | Shared `TAG_COLORS` palette used by both TagSelector and SocialTags |
| `src/components/social/tags/useCreateTagMutation.ts` | **Modify** | Accept `{ name, color }` instead of bare `string` |
| `src/lib/copy.ts` | **Modify** | Add strings for color picker UI, archive actions, duplicate error |
| `src/components/social/tags/TagSelector.tsx` | **Modify** | Inline create panel with color swatches + custom color picker |
| `src/pages/SocialTags.jsx` | **Modify** | Active/Archived tabs, drag-to-archive, usage count, duplicate guard |
| `src/pages/SocialCalendar.jsx` | **Modify** | Replace `activeTagIds` useState with `useSearchParams` |

---

## Task 1: Extract TAG_COLORS to a shared constant

**Files:**
- Create: `src/constants/tags.ts`
- Modify: `src/pages/SocialTags.jsx`

- [ ] **Step 1: Create the constants file**

```ts
// src/constants/tags.ts
export const TAG_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#64748b',
  '#000000',
];
```

- [ ] **Step 2: Replace the inline array in SocialTags.jsx**

In `src/pages/SocialTags.jsx`, delete the existing `TAG_COLORS` declaration (lines 10–23) and add the import at the top of the file with the other imports:

```js
import { TAG_COLORS } from '@/constants/tags';
```

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run typecheck
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/constants/tags.ts src/pages/SocialTags.jsx
git commit -m "refactor(2120): extract TAG_COLORS to shared constant"
```

---

## Task 2: Extend useCreateTagMutation to accept color

**Files:**
- Modify: `src/components/social/tags/useCreateTagMutation.ts`

- [ ] **Step 1: Update the mutation input type and payload**

Replace the entire file content:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { slugifyTag } from '@/utils/tags';
import type { TagOption } from '@/types/tags';

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation<TagOption, Error, { name: string; color?: string }>({
    mutationFn: async ({ name, color }): Promise<TagOption> => {
      const trimmedName = name.trim();
      const slug = slugifyTag(trimmedName);
      const payload: Record<string, unknown> = { name: trimmedName };
      if (slug) payload.slug = slug;
      if (color) payload.color = color;
      const raw = await base44.entities.SocialTag.create(payload);
      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        color: raw.color,
        description: raw.description,
      };
    },
    onSuccess: (newTag) => {
      queryClient.setQueryData<TagOption[]>(['social-tags'], (old = []) => [...old, newTag]);
    },
  });
}
```

- [ ] **Step 2: Update the call site in TagSelector.tsx**

In `src/components/social/tags/TagSelector.tsx`, find the `handleCreate` callback. Change:

```ts
const newTag = await createTag(name);
```

to:

```ts
const newTag = await createTag({ name });
```

(Color will be threaded through properly in Task 4 — this keeps it compiling for now.)

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/social/tags/useCreateTagMutation.ts src/components/social/tags/TagSelector.tsx
git commit -m "refactor(2120): extend useCreateTagMutation to accept color"
```

---

## Task 3: Add copy strings

**Files:**
- Modify: `src/lib/copy.ts`

- [ ] **Step 1: Add tagSelector strings**

In `src/lib/copy.ts`, inside the `tagSelector` object, add after `deleteTagLabel`:

```ts
colorLabel: 'Color',
createWithColor: 'Create',
```

- [ ] **Step 2: Add socialTags section**

After the `tagPill` block, add a new top-level key:

```ts
socialTags: {
  activeTab: 'Active',
  archivedTab: 'Archived',
  archiveSuccess: (name: string) => `"${name}" archived`,
  unarchiveSuccess: (name: string) => `"${name}" unarchived`,
  duplicateNameError: 'A tag with this name already exists.',
  postCount: (n: number) => `${n} post${n === 1 ? '' : 's'}`,
},
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/copy.ts
git commit -m "feat(2120): add copy strings for tag enhancements"
```

---

## Task 4: TagSelector — inline create with color picker

**Files:**
- Modify: `src/components/social/tags/TagSelector.tsx`

- [ ] **Step 1: Add new state and imports**

At the top of `TagSelector.tsx`, add `TAG_COLORS` to imports:

```ts
import { TAG_COLORS } from '@/constants/tags';
```

Inside the `TagSelector` function body, after the existing `const [search, setSearch] = useState('');` line, add:

```ts
const [isCreateExpanded, setIsCreateExpanded] = useState(false);
const [createColor, setCreateColor] = useState(TAG_COLORS[0]);
```

- [ ] **Step 2: Update handleOpenChange to reset create state**

Replace the existing `handleOpenChange`:

```ts
const handleOpenChange = (next: boolean) => {
  if (disabled && next) return;
  setOpen(next);
  if (!next) {
    setSearch('');
    setIsCreateExpanded(false);
    setCreateColor(TAG_COLORS[0]);
  }
};
```

- [ ] **Step 3: Update handleCreate to use createColor and collapse panel**

Replace the existing `handleCreate`:

```ts
const handleCreate = useCallback(async () => {
  const name = search.trim();
  if (!name || isCreating) return;
  if (value.length >= MAX_TAGS) {
    toast.error(SELECTOR_COPY.atLimit);
    return;
  }
  try {
    const newTag = await createTag({ name, color: createColor });
    onChange([...value, newTag]);
    setSearch('');
    setIsCreateExpanded(false);
    setCreateColor(TAG_COLORS[0]);
  } catch {
    toast.error(SELECTOR_COPY.createError);
  }
}, [search, value, onChange, createTag, isCreating, createColor]);
```

- [ ] **Step 4: Also reset create state when search is cleared**

Replace the existing `handleKeyDown`:

```ts
const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Backspace' && !search && value.length > 0) {
    onChange(value.slice(0, -1));
  }
};
```

And update the `onValueChange` on `CommandInput` to also reset expand state when search empties:

```tsx
onValueChange={(val) => {
  setSearch(val);
  if (!val.trim()) {
    setIsCreateExpanded(false);
    setCreateColor(TAG_COLORS[0]);
  }
}}
```

Remove the standalone `onValueChange={setSearch}` and replace with the above.

- [ ] **Step 5: Replace the showCreateOption block in JSX**

Find the `{showCreateOption && (...)}` block (currently lines 229–244) and replace it entirely:

```tsx
{showCreateOption && (
  <>
    {filteredTags.length > 0 && <CommandSeparator />}
    <CommandGroup>
      <CommandItem
        value={`__create__:${search}`}
        onSelect={() => setIsCreateExpanded((prev) => !prev)}
        disabled={isCreating || atLimit}
        className="gap-2"
      >
        <Plus className="h-4 w-4 shrink-0" />
        {SELECTOR_COPY.createTag(search.trim())}
      </CommandItem>
    </CommandGroup>
    {isCreateExpanded && !atLimit && (
      <div className="border-t border-border px-3 py-2.5 space-y-2.5">
        {/* Live preview */}
        <TagPill
          tag={{ id: '__preview__', name: search.trim(), color: createColor }}
          size="sm"
        />
        {/* Color label */}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {SELECTOR_COPY.colorLabel}
        </p>
        {/* Swatches */}
        <div className="flex flex-wrap gap-1.5">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setCreateColor(c)}
              className={cn(
                'w-5 h-5 rounded-full transition-transform hover:scale-110',
                createColor === c && 'outline outline-2 outline-offset-1'
              )}
              style={{
                backgroundColor: c,
                outlineColor: createColor === c ? c : undefined,
              }}
            />
          ))}
          {/* Custom color swatch — rainbow when no custom picked, hex circle when picked */}
          <label
            className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 overflow-hidden relative flex-shrink-0"
            title="Custom color"
            style={
              !TAG_COLORS.includes(createColor)
                ? {
                    backgroundColor: createColor,
                    outline: `2px solid ${createColor}`,
                    outlineOffset: '1px',
                  }
                : {
                    background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
                    border: '1px solid #e2e8f0',
                  }
            }
          >
            <input
              type="color"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              value={createColor}
              onChange={(e) => setCreateColor(e.target.value)}
            />
          </label>
        </div>
        {/* Hex label + Create button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground flex-1">{createColor}</span>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="text-xs font-semibold text-white rounded-md px-3 py-1 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: createColor }}
          >
            {SELECTOR_COPY.createWithColor}
          </button>
        </div>
      </div>
    )}
  </>
)}
```

- [ ] **Step 6: Verify**

```bash
npm run lint && npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/social/tags/TagSelector.tsx
git commit -m "feat(2120): add color picker to inline tag creation"
```

---

## Task 5: SocialTags — duplicate guard, usage count, and tabs

**Files:**
- Modify: `src/pages/SocialTags.jsx`

- [ ] **Step 1: Add missing imports to SocialTags.jsx**

At the top of `src/pages/SocialTags.jsx`, add to the existing `@tanstack/react-query` import:

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
```

(`useQueryClient` is already imported — confirm it's present. If not, add it.)

Add to the lucide-react import line:

```js
import { Tag, Plus, Pencil, Trash2, X, Check, GripVertical } from 'lucide-react';
```

Add below the existing imports:

```js
import COPY from '@/lib/copy';
```

- [ ] **Step 2: Add duplicate guard to TagFormModal**

Inside the `TagFormModal` function, add state and update `handleSave`:

Add after the existing `useState` declarations:

```js
const [nameError, setNameError] = useState('');
```

Replace the existing `handleSave`:

```js
const handleSave = () => {
  if (!name.trim()) return;
  const existingTags = queryClient.getQueryData(['social-tags']) || [];
  const normalised = name.trim().toLowerCase();
  const duplicate = existingTags.find(
    (t) => t.name.toLowerCase() === normalised && t.id !== tag?.id
  );
  if (duplicate) {
    setNameError(COPY.socialTags.duplicateNameError);
    return;
  }
  setNameError('');
  saveMutation.mutate({ name: name.trim(), color, description });
};
```

In the JSX, show the error below the name input. Replace:

```jsx
<div>
  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Tag Name</label>
  <Input
    placeholder="e.g. Campaign, Product Launch"
    value={name}
    onChange={(e) => setName(e.target.value)}
    autoFocus
    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
  />
</div>
```

with:

```jsx
<div>
  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Tag Name</label>
  <Input
    placeholder="e.g. Campaign, Product Launch"
    value={name}
    onChange={(e) => {
      setName(e.target.value);
      if (nameError) setNameError('');
    }}
    autoFocus
    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
    className={nameError ? 'border-red-400 focus-visible:ring-red-400' : ''}
  />
  {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
</div>
```

Also reset `nameError` in the `useEffect` that runs on `open`:

```js
React.useEffect(() => {
  if (open) {
    setName(tag?.name || '');
    setColor(tag?.color || TAG_COLORS[0]);
    setDescription(tag?.description || '');
    setNameError('');
  }
}, [open, tag]);
```

- [ ] **Step 3: Add Active/Archived tabs to SocialTags component**

In the `SocialTags` function, add tab state after the existing state declarations:

```js
const [activeTab, setActiveTab] = useState('active');
```

Add derived lists:

```js
const activeTags = tags.filter((t) => !t.is_archived);
const archivedTags = tags.filter((t) => t.is_archived);
const visibleTags = activeTab === 'active' ? activeTags : archivedTags;
```

Replace the current tags list render block. Find the existing `{tags.length === 0 ? (...)  : (...)}` section and replace it with:

```jsx
{/* Tabs */}
<div className="flex border-b border-gray-200 dark:border-gray-700 -mb-px">
  <button
    onClick={() => setActiveTab('active')}
    className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
      activeTab === 'active'
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
    }`}
  >
    {COPY.socialTags.activeTab}
    <span
      className={`rounded-full px-1.5 text-xs font-semibold ${
        activeTab === 'active'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {activeTags.length}
    </span>
  </button>
  <button
    onClick={() => setActiveTab('archived')}
    className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
      activeTab === 'archived'
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
    }`}
  >
    {COPY.socialTags.archivedTab}
    <span
      className={`rounded-full px-1.5 text-xs font-semibold ${
        activeTab === 'archived'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {archivedTags.length}
    </span>
  </button>
</div>

{/* Tag list */}
{isLoading ? (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-16 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl m-2" />
    ))}
  </div>
) : visibleTags.length === 0 ? (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-16 flex flex-col items-center gap-3 text-center px-6">
    <Tag className="w-7 h-7 text-gray-300" />
    <p className="text-sm text-gray-500">
      {activeTab === 'active' ? 'No active tags.' : 'No archived tags.'}
    </p>
    {activeTab === 'active' && (
      <Button onClick={openNew} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-1">
        <Plus className="w-4 h-4" /> New Tag
      </Button>
    )}
  </div>
) : (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
    {visibleTags.map((tag) => (
      <div key={tag.id} className="flex items-center justify-between px-5 py-4 group">
        <div className="flex items-center gap-3 min-w-0">
          <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white flex-shrink-0 ${tag.is_archived ? 'opacity-60' : ''}`}
            style={{ backgroundColor: tag.color || '#6366f1' }}
          >
            <Tag className="w-3.5 h-3.5" />
            {tag.name}
          </span>
          {tag.description && (
            <span className="text-sm text-gray-400 truncate">{tag.description}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tag.usage_count != null && (
            <span className="text-xs text-gray-400 tabular-nums">
              {COPY.socialTags.postCount(tag.usage_count)}
            </span>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEdit(tag)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTagToDelete(tag)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
```

Also move the "New Tag" button in the header to only show when `activeTab === 'active'`:

```jsx
{activeTab === 'active' && (
  <Button onClick={openNew} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4">
    <Plus className="w-4 h-4" /> New Tag
  </Button>
)}
```

- [ ] **Step 4: Verify**

```bash
npm run lint && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/SocialTags.jsx
git commit -m "feat(2120): add tabs, usage count, and duplicate guard to Tags page"
```

---

## Task 6: SocialTags — drag-to-archive

**Files:**
- Modify: `src/pages/SocialTags.jsx`

- [ ] **Step 1: Add dnd-kit imports**

At the top of `src/pages/SocialTags.jsx`, add:

```js
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
```

- [ ] **Step 2: Add the archive mutation**

Inside the `SocialTags` function, after the `deleteMutation`, add:

```js
const archiveMutation = useMutation({
  mutationFn: ({ id, is_archived }) => base44.entities.SocialTag.update(id, { is_archived }),
  onSuccess: (_, { is_archived, id }) => {
    queryClient.invalidateQueries({ queryKey: ['social-tags'] });
    const tag = tags.find((t) => t.id === id);
    if (tag) {
      toast.success(
        is_archived
          ? COPY.socialTags.archiveSuccess(tag.name)
          : COPY.socialTags.unarchiveSuccess(tag.name)
      );
    }
  },
});
```

Add `import { toast } from 'sonner';` at the top if not already present.

- [ ] **Step 3: Add handleDragEnd**

Inside the `SocialTags` function, add:

```js
const handleDragEnd = ({ active, over }) => {
  if (!over) return;
  const tag = tags.find((t) => t.id === active.id);
  if (!tag) return;
  const droppingOnArchived = over.id === 'archived';
  if (Boolean(tag.is_archived) === droppingOnArchived) return;
  archiveMutation.mutate({ id: tag.id, is_archived: droppingOnArchived });
  setActiveTab(droppingOnArchived ? 'archived' : 'active');
};
```

- [ ] **Step 4: Create DraggableTagRow component**

Add this component function above the `SocialTags` default export (below `TagFormModal`):

```jsx
function DraggableTagRow({ tag, onEdit, onDelete, isDeletePending, onArchiveToggle }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tag.id,
    data: { tag },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-5 py-4 group ${isDragging ? 'opacity-40 z-50 relative' : ''}`}
      {...attributes}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 flex-shrink-0"
          aria-label="Drag to archive or unarchive"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white flex-shrink-0 ${tag.is_archived ? 'opacity-60' : ''}`}
          style={{ backgroundColor: tag.color || '#6366f1' }}
        >
          <Tag className="w-3.5 h-3.5" />
          {tag.name}
        </span>
        {tag.description && (
          <span className="text-sm text-gray-400 truncate">{tag.description}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {tag.usage_count != null && (
          <span className="text-xs text-gray-400 tabular-nums">
            {COPY.socialTags.postCount(tag.usage_count)}
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(tag)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tag)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            disabled={isDeletePending}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create DroppableTab component**

Add this component above `DraggableTagRow`:

```jsx
function DroppableTab({ id, label, count, isActive, onClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
      } ${isOver ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 !text-amber-700' : ''}`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-xs font-semibold ${
          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        } ${isOver ? '!bg-amber-100 !text-amber-800' : ''}`}
      >
        {count}
      </span>
    </button>
  );
}
```

- [ ] **Step 6: Wire up DndContext and replace the tabs + list JSX**

In `SocialTags`, make two targeted changes:

**Change A — wrap the outer content div with DndContext.** Find the opening of the return:

```jsx
return (
  <div className="p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="max-w-2xl mx-auto space-y-6">
```

Replace with:

```jsx
return (
  <div className="p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
    <DndContext onDragEnd={handleDragEnd}>
    <div className="max-w-2xl mx-auto space-y-6">
```

And close the `DndContext` just before the `</div>` that closes the outer `p-6` div — immediately before `<TagFormModal`:

```jsx
    </div>
    </DndContext>

    <TagFormModal open={showModal} onClose={closeModal} tag={editingTag} />
```

**Change B — replace the two plain tab `<button>` elements** (added in Task 5 Step 3) with `DroppableTab` components. Find the tabs block:

```jsx
<div className="flex border-b border-gray-200 dark:border-gray-700 -mb-px">
  <button
    onClick={() => setActiveTab('active')}
    className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
      activeTab === 'active'
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
    }`}
  >
    {COPY.socialTags.activeTab}
    <span
      className={`rounded-full px-1.5 text-xs font-semibold ${
        activeTab === 'active'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {activeTags.length}
    </span>
  </button>
  <button
    onClick={() => setActiveTab('archived')}
    className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
      activeTab === 'archived'
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
    }`}
  >
    {COPY.socialTags.archivedTab}
    <span
      className={`rounded-full px-1.5 text-xs font-semibold ${
        activeTab === 'archived'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {archivedTags.length}
    </span>
  </button>
</div>
```

Replace with:

```jsx
<div className="flex border-b border-gray-200 dark:border-gray-700 -mb-px">
  <DroppableTab
    id="active"
    label={COPY.socialTags.activeTab}
    count={activeTags.length}
    isActive={activeTab === 'active'}
    onClick={() => setActiveTab('active')}
  />
  <DroppableTab
    id="archived"
    label={COPY.socialTags.archivedTab}
    count={archivedTags.length}
    isActive={activeTab === 'archived'}
    onClick={() => setActiveTab('archived')}
  />
</div>
```

**Change C — replace the inline `<div key={tag.id}>` rows** in the list with `<DraggableTagRow>`. Find the list render inside the non-empty branch:

```jsx
<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
  {visibleTags.map((tag) => (
    <div key={tag.id} className="flex items-center justify-between px-5 py-4 group">
```

Replace the entire `visibleTags.map(...)` block with:

```jsx
<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
  {visibleTags.map((tag) => (
    <DraggableTagRow
      key={tag.id}
      tag={tag}
      onEdit={openEdit}
      onDelete={setTagToDelete}
      isDeletePending={deleteMutation.isPending}
    />
  ))}
</div>
```

- [ ] **Step 7: Verify**

```bash
npm run lint && npm run typecheck
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/SocialTags.jsx
git commit -m "feat(2120): add drag-to-archive on Tags page"
```

---

## Task 7: SocialCalendar — tag filter URL persistence

**Files:**
- Modify: `src/pages/SocialCalendar.jsx`

- [ ] **Step 1: Add useSearchParams import**

In `src/pages/SocialCalendar.jsx`, find the `useState` import line:

```js
import { useState, useEffect } from 'react';
```

Add `useSearchParams` from React Router. Add a new import line:

```js
import { useSearchParams } from 'react-router-dom';
```

- [ ] **Step 2: Replace activeTagIds state with URL params**

Find and remove:

```js
const [activeTagIds, setActiveTagIds] = useState(/** @type {string[]} */ ([]));
```

Replace with:

```js
const [searchParams, setSearchParams] = useSearchParams();
const activeTagIds = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
const setActiveTagIds = (ids) => {
  setSearchParams(
    (prev) => {
      if (ids.length === 0) {
        prev.delete('tags');
      } else {
        prev.set('tags', ids.join(','));
      }
      return prev;
    },
    { replace: true }
  );
};
```

- [ ] **Step 3: Update clearAllFilters**

Find:

```js
const clearAllFilters = () => {
  setPlatformFilter('all');
  setStatusFilter('all');
  setActiveTagIds([]);
};
```

No change needed — `setActiveTagIds([])` still works with the new implementation.

- [ ] **Step 4: Verify nothing else references old state**

Run:

```bash
grep -n "activeTagIds\|setActiveTagIds" src/pages/SocialCalendar.jsx
```

All references should still work — `activeTagIds` is still an array, `setActiveTagIds` still accepts `string[]`. No other changes needed.

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/SocialCalendar.jsx
git commit -m "feat(2120): persist tag filter in URL via useSearchParams"
```

---

## Final verification

- [ ] Run `npm run dev` and manually verify:
  1. In `TagSelector`, type a new tag name → "Create tag" row appears → click it → color panel expands → pick a preset + custom color → Create button works
  2. In `/social/tags`, Active/Archived tabs switch correctly with counts
  3. Drag a tag row onto the opposite tab → it archives/unarchives, tab switches, toast appears
  4. Creating a tag with a duplicate name shows inline error in the modal
  5. Tag rows show usage count when `usage_count` is set
  6. Set a tag filter on the calendar, refresh the page → filter is restored from URL
- [ ] Run `npm run build` — no build errors
- [ ] Commit if any lint auto-fixes were applied
