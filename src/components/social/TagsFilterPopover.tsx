import { useState } from 'react';
import { Check, ChevronDown, Tag as TagIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';
import type { TagOption } from '@/types/tags';

type TagsFilterPopoverProps = {
  activeTagIds: string[];
  allTags: TagOption[];
  onChange: (ids: string[]) => void;
  className?: string;
};

/**
 * A Popover trigger pill that opens directly into a searchable tag list — no
 * wrapper title or extra click between opening the popover and starting the
 * search. The Command palette's input auto-focuses when the popover opens, so
 * the user can immediately type to filter the list.
 *
 * Built on cmdk primitives directly rather than wrapping `<TagSelector>` to
 * avoid the nested-Popover redundancy that was flagged in PR review.
 */
export default function TagsFilterPopover(props: TagsFilterPopoverProps) {
  const { activeTagIds, allTags, onChange, className } = props;
  const [open, setOpen] = useState(false);
  const count = activeTagIds.length;
  const selectedIds = new Set(activeTagIds);

  const visibleTags = allTags.filter((t) => !t.is_archived);

  const handleToggle = (tagId: string) => {
    if (selectedIds.has(tagId)) {
      onChange(activeTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...activeTagIds, tagId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white focus-visible:ring-gray-400 dark:focus-visible:ring-offset-gray-900 dark:focus-visible:ring-gray-500',
          className
        )}
        aria-label={COPY.tagsFilter.triggerAriaLabel(count)}
      >
        <TagIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        <span>{COPY.tagsFilter.triggerLabel}</span>
        {count > 0 && (
          <span className="ml-0.5 rounded bg-slate-100 px-1 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {count}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-0 data-[state=closed]:hidden"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder={COPY.socialCalendar.tagFilterPlaceholder} />
          <CommandList>
            <CommandEmpty>{COPY.tagsFilter.noResults}</CommandEmpty>
            {visibleTags.length > 0 && (
              <CommandGroup>
                {visibleTags.map((tag) => {
                  const isSelected = selectedIds.has(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleToggle(tag.id)}
                      className="gap-2"
                    >
                      <Check
                        className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color || '#6366f1' }}
                        aria-hidden="true"
                      />
                      <span className="truncate flex-1">{tag.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
