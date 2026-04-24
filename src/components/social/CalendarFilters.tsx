import { cn } from '@/lib/utils';
import type { PostStatus } from '@/types/enums';
import type { TagOption } from '@/types/tags';
import PostStatusLegend from '@/components/social/PostStatusLegend';
import PlatformFilterChips, { type PlatformId } from '@/components/social/PlatformFilterChips';
import TagsFilterPopover from '@/components/social/TagsFilterPopover';

export type CalendarFiltersProps = {
  // Status
  statusCounts: Partial<Record<PostStatus, number>>;
  activeStatusFilters: Set<PostStatus>;
  onToggleStatus: (status: PostStatus) => void;
  // Platform
  activePlatformFilters: Set<PlatformId>;
  onTogglePlatform: (platform: PlatformId) => void;
  // Tags
  activeTagIds: string[];
  allTags: TagOption[];
  onChangeTagIds: (ids: string[]) => void;
  // Clear all dimensions at once
  onClearAll: () => void;
  className?: string;
};

export default function CalendarFilters(props: CalendarFiltersProps) {
  const {
    statusCounts,
    activeStatusFilters,
    onToggleStatus,
    activePlatformFilters,
    onTogglePlatform,
    activeTagIds,
    allTags,
    onChangeTagIds,
    onClearAll,
    className,
  } = props;
  const hasAnyFiltersActive =
    activeStatusFilters.size > 0 || activePlatformFilters.size > 0 || activeTagIds.length > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Row 1: Status chips. onClearFilters at the page level clears ALL dimensions. */}
      <PostStatusLegend
        counts={statusCounts}
        activeFilters={activeStatusFilters}
        onToggle={onToggleStatus}
        onClearFilters={onClearAll}
        hasAnyFiltersActive={hasAnyFiltersActive}
      />

      {/* Row 2: Platform chips + vertical divider + Tags popover, right-aligned with 12px gaps. */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <PlatformFilterChips activeFilters={activePlatformFilters} onToggle={onTogglePlatform} />
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
        <TagsFilterPopover
          activeTagIds={activeTagIds}
          allTags={allTags}
          onChange={onChangeTagIds}
        />
      </div>
    </div>
  );
}
