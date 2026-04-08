import { useState, useCallback } from 'react';
import { Check, Plus, Tag } from 'lucide-react';
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
import COPY from '@/lib/copy';
import type { TagOption } from '@/types/tags';

const SELECTOR_COPY = COPY.tagSelector;

interface TagSelectorProps {
  value: TagOption[];
  onChange: (tags: TagOption[]) => void;
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function TagSelector({
  value,
  onChange,
  allowCreate = false,
  disabled = false,
  placeholder,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allTags = [], isLoading } = useTagsQuery();
  const { mutateAsync: createTag, isPending: isCreating } = useCreateTagMutation();

  const selectedIds = new Set(value.map((t) => t.id));

  const filteredTags = allTags.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasExactMatch = allTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
    if (!next) setSearch('');
  };

  const handleSelect = useCallback(
    (tag: TagOption) => {
      if (value.some((t) => t.id === tag.id)) {
        onChange(value.filter((t) => t.id !== tag.id));
      } else {
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
    try {
      const newTag = await createTag(name);
      onChange([...value, newTag]);
      setSearch('');
    } catch {
      // create failed; user can retry
    }
  }, [search, value, onChange, createTag, isCreating]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !search && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const showCreateOption = allowCreate && search.trim() && !hasExactMatch;
  const showEmpty = filteredTags.length === 0 && !showCreateOption;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) setOpen(true);
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
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={SELECTOR_COPY.searchPlaceholder}
            value={search}
            onValueChange={setSearch}
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
                        className="gap-2"
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
                        <span className="truncate">{tag.name}</span>
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
                        onSelect={handleCreate}
                        disabled={isCreating}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        {SELECTOR_COPY.createTag(search.trim())}
                      </CommandItem>
                    </CommandGroup>
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
