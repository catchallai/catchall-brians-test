import { ChevronDown, Tag as TagIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';
import { TagSelector } from '@/components/social/tags/TagSelector';
import type { TagOption } from '@/types/tags';

export type TagsFilterPopoverProps = {
  activeTagIds: string[];
  allTags: TagOption[];
  onChange: (ids: string[]) => void;
  className?: string;
};

export default function TagsFilterPopover(props: TagsFilterPopoverProps) {
  const { activeTagIds, allTags, onChange, className } = props;
  const count = activeTagIds.length;
  const selected = allTags.filter((t) => activeTagIds.includes(t.id));

  return (
    <Popover>
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
      <PopoverContent align="end" className="w-72 p-3">
        <div className="mb-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          {COPY.tagsFilter.popoverTitle}
        </div>
        <TagSelector
          value={selected}
          onChange={(tags: TagOption[]) => onChange(tags.map((t) => t.id))}
          placeholder={COPY.socialCalendar.tagFilterPlaceholder}
        />
      </PopoverContent>
    </Popover>
  );
}
