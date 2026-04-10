import { useState, useCallback } from 'react';
import { TAG_COLORS } from '@/constants/tags';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Check, Plus, Tag, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { TagPill } from './TagPill';
import { useTagsQuery } from './useTagsQuery';
import { useCreateTagMutation } from './useCreateTagMutation';
import { useDeleteTagMutation } from './useDeleteTagMutation';
import { toast } from 'sonner';
import COPY from '@/lib/copy';
import type { TagOption } from '@/types/tags';

const SELECTOR_COPY = COPY.tagSelector;
const MAX_TAGS = 10;

/**
 * TagSelector is a controlled multi-select component for tags.
 * Provides search, create-new-tag, and multi-select UI in a popover.
 * Used for selecting tags on posts and other entities.
 * @param value Array of selected TagOption objects
 * @param onChange Callback when selected tags change
 * @param allowCreate Allow creating new tags from input
 * @param disabled Disable the selector
 * @param placeholder Placeholder text
 * @param ariaLabel Accessible label for the combobox
 */
interface TagSelectorProps {
  value: TagOption[];
  onChange: (tags: TagOption[]) => void;
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

export function TagSelector({
  value,
  onChange,
  allowCreate = false,
  disabled = false,
  placeholder,
  ariaLabel,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const [createColor, setCreateColor] = useState(TAG_COLORS[0]);

  const { data: allTags = [], isLoading } = useTagsQuery();
  const { mutateAsync: createTag, isPending: isCreating } = useCreateTagMutation();
  const { mutateAsync: deleteTag, isPending: isDeleting } = useDeleteTagMutation();

  const selectedIds = new Set(value.map((t) => t.id));

  const filteredTags = allTags.filter(
    (t) => !t.is_archived && (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  const hasExactMatch = allTags.some(
    (t) => !t.is_archived && t.name.toLowerCase() === search.trim().toLowerCase()
  );

  const handleOpenChange = (next: boolean) => {
    if (disabled && next) return;
    setOpen(next);
    if (!next) {
      setSearch('');
      setIsCreateExpanded(false);
      setCreateColor(TAG_COLORS[0]);
    }
  };

  const handleSelect = useCallback(
    (tag: TagOption) => {
      if (value.some((t) => t.id === tag.id)) {
        onChange(value.filter((t) => t.id !== tag.id));
      } else {
        if (value.length >= MAX_TAGS) {
          toast.error(SELECTOR_COPY.atLimit);
          return;
        }
        onChange([...value, tag]);
      }
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => onChange(value.filter((t) => t.id !== id)),
    [value, onChange]
  );

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

  const handleDelete = useCallback(
    async (tag: TagOption, e: MouseEvent) => {
      e.stopPropagation();
      if (isDeleting) return;
      try {
        await deleteTag(tag.id);
        // Also remove from current selection if it was selected
        if (selectedIds.has(tag.id)) {
          onChange(value.filter((t) => t.id !== tag.id));
        }
        toast.success(SELECTOR_COPY.deleteSuccess(tag.name));
      } catch {
        toast.error(SELECTOR_COPY.deleteError);
      }
    },
    [isDeleting, deleteTag, selectedIds, value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !search && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const showCreateOption = allowCreate && search.trim() && !hasExactMatch;
  const showEmpty = filteredTags.length === 0 && !showCreateOption;
  const atLimit = value.length >= MAX_TAGS;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={ariaLabel || placeholder || SELECTOR_COPY.placeholder}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm cursor-pointer select-none',
            disabled && 'cursor-not-allowed opacity-50',
            open && 'outline-none ring-1 ring-ring'
          )}
        >
          {value.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              size="sm"
              onRemove={disabled ? undefined : () => handleRemove(tag.id)}
            />
          ))}
          {value.length === 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {placeholder ?? SELECTOR_COPY.placeholder}
            </span>
          )}
          {atLimit && <span className="ml-auto text-xs text-muted-foreground">10/10</span>}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="start" onWheel={(e) => e.stopPropagation()}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={SELECTOR_COPY.searchPlaceholder}
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              const wouldShowCreate =
                allowCreate &&
                !!val.trim() &&
                !allTags.some((t) => t.name.toLowerCase() === val.trim().toLowerCase());
              if (!wouldShowCreate) {
                setIsCreateExpanded(false);
                setCreateColor(TAG_COLORS[0]);
              }
            }}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>{SELECTOR_COPY.loading}</CommandEmpty>
            ) : showEmpty ? (
              <CommandEmpty>{SELECTOR_COPY.noResults}</CommandEmpty>
            ) : (
              <>
                {filteredTags.length > 0 && (
                  <CommandGroup>
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.id}
                        onSelect={() => handleSelect(tag)}
                        className="gap-2 group"
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            selectedIds.has(tag.id) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || '#6366f1' }}
                        />
                        <span className="truncate flex-1">{tag.name}</span>
                        <button
                          type="button"
                          aria-label={SELECTOR_COPY.deleteTagLabel(tag.name)}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => handleDelete(tag, e)}
                          disabled={isDeleting}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity rounded p-0.5 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

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
                                    background:
                                      'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
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
                          <span className="text-xs font-mono text-muted-foreground flex-1">
                            {createColor}
                          </span>
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
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
