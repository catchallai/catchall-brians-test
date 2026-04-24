import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';
import Tooltip from '@/components/ui-custom/Tooltip';
import { PostStatus } from '@/types/enums';
import {
  LEGEND_VISIBLE_STATUSES,
  POST_STATUS_CONFIG,
  getPostStatusStyles,
} from '@/lib/postStatusConfig';

export type PostStatusLegendProps = {
  counts: Partial<Record<PostStatus, number>>;
  activeFilters: Set<PostStatus>;
  onToggle: (status: PostStatus) => void;
  onClear: () => void;
  className?: string;
};

export default function PostStatusLegend(props: PostStatusLegendProps) {
  const { counts, activeFilters, onToggle, onClear, className } = props;
  const hasAnyActive = activeFilters.size > 0;

  return (
    <div
      role="group"
      aria-label={COPY.postStatusLegend.groupLabel}
      className={cn(
        'flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40',
        className
      )}
    >
      {LEGEND_VISIBLE_STATUSES.map((status) => {
        const config = POST_STATUS_CONFIG[status];
        const styles = getPostStatusStyles(status);
        const Icon = config.icon;
        const count = counts[status] ?? 0;
        const isActive = activeFilters.has(status);
        const isDimmed = hasAnyActive && !isActive;

        return (
          <Tooltip key={status} content={config.description} side="top">
            <button
              type="button"
              onClick={() => onToggle(status)}
              aria-pressed={isActive}
              aria-label={COPY.postStatusLegend.chipAriaLabel(
                config.label,
                config.description,
                count
              )}
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
          </Tooltip>
        );
      })}

      {hasAnyActive && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 rounded"
        >
          {COPY.postStatusLegend.clearFilters}
        </button>
      )}
    </div>
  );
}
