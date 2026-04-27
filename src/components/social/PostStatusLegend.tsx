import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';
import { PostStatus } from '@/types/enums';
import {
  LEGEND_VISIBLE_STATUSES,
  POST_STATUS_CONFIG,
  getPostStatusStyles,
} from '@/lib/postStatusConfig';

type PostStatusLegendProps = {
  counts: Partial<Record<PostStatus, number>>;
  activeFilters: Set<PostStatus>;
  onToggle: (status: PostStatus) => void;
  onClearFilters: () => void;
  /**
   * Optional override for the visibility of the "Clear filters" link.
   * `CalendarFilters` passes this so the link appears whenever ANY filter
   * dimension (status, platform, or tags) is active. When omitted, the link's
   * visibility falls back to the local status-filter state.
   */
  hasAnyFiltersActive?: boolean;
  className?: string;
};

/**
 * Renders the row of post-status chips above the social calendar.
 *
 * The component is **both a legend and a filter**: each chip shows its
 * status's color, icon, and current post count (acting as a legend), and
 * clicking a chip toggles a multi-select filter on the calendar (acting as
 * a filter). When at least one chip is active, a "Clear filters" link
 * appears above the chip row.
 *
 * Stateless / controlled — the parent owns the active-filter `Set` and
 * count map, and supplies the toggle and clear handlers.
 */
export default function PostStatusLegend(props: PostStatusLegendProps) {
  const { counts, activeFilters, onToggle, onClearFilters, hasAnyFiltersActive, className } = props;
  const hasAnyActiveStatus = activeFilters.size > 0;
  const showClearFilters = hasAnyFiltersActive ?? hasAnyActiveStatus;

  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40',
        className
      )}
    >
      {/* Clear filters strip — fixed-height row above the chips so chip layout
          does not shift when the link appears/disappears on toggle. */}
      <div className="flex justify-end items-center px-4 pt-2 h-7">
        {showClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 rounded"
          >
            {COPY.postStatusLegend.clearFilters}
          </button>
        )}
      </div>
      {/* Status chip row */}
      <div
        role="group"
        aria-label={COPY.postStatusLegend.groupLabel}
        className="flex flex-wrap items-center justify-end gap-2 px-4 pt-1 pb-3"
      >
        {LEGEND_VISIBLE_STATUSES.map((status) => {
          const config = POST_STATUS_CONFIG[status];
          const styles = getPostStatusStyles(status);
          const Icon = config.icon;
          const count = counts[status] ?? 0;
          const isActive = activeFilters.has(status);
          const isDimmed = hasAnyActiveStatus && !isActive;

          return (
            <button
              key={status}
              type="button"
              onClick={() => onToggle(status)}
              aria-pressed={isActive}
              aria-label={COPY.postStatusLegend.chipAriaLabel(
                config.label,
                config.description,
                count
              )}
              title={config.description}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white focus-visible:ring-gray-400 dark:focus-visible:ring-offset-gray-900 dark:focus-visible:ring-gray-500',
                styles.bgClass,
                styles.borderClass,
                styles.textClass,
                isActive && `ring-2 ring-offset-1 ${styles.activeRingClass}`,
                isDimmed && 'opacity-60'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', styles.iconClass)} aria-hidden="true" />
              <span>{config.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'ml-0.5 rounded px-1 text-[10px] font-semibold tabular-nums',
                    'bg-white/70 dark:bg-black/20'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
