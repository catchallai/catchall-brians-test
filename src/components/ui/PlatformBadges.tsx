// src/components/ui/PlatformBadges.tsx
import COPY from '@/lib/copy';
import { PLATFORM_MAP, PLATFORM_MAP_LOWER } from '@/constants/platforms';
import type { PlatformId } from '@/types/enums';

interface PlatformBadgesProps {
  platforms: string[];
  size?: 'sm' | 'md' | 'lg';
  /**
   * Maximum icons to show before overflow pill (sm/md only).
   * When overflow occurs, shows (maxVisible - 1) icons + "+N" pill.
   * Defaults to 4. Ignored for size="lg" which always shows all platforms.
   */
  maxVisible?: number;
  className?: string;
}

const DEFAULT_MAX_VISIBLE = 4;

const sizeConfig = {
  sm: { px: 14, radius: 3, gap: 'gap-0.5', iconSize: 9 },
  md: { px: 18, radius: 4, gap: 'gap-1', iconSize: 11 },
};

export function PlatformBadges({
  platforms,
  size = 'sm',
  maxVisible,
  className = '',
}: PlatformBadgesProps) {
  if (!platforms || platforms.length === 0) return null;

  /** Case-insensitive lookup: handles both 'Twitter' (calendar) and 'twitter' (listening). */
  const lookup = (id: string) =>
    PLATFORM_MAP[id as PlatformId] ?? PLATFORM_MAP_LOWER[id.toLowerCase()];

  if (size === 'lg') {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {platforms.map((platformId) => {
          const platform = lookup(platformId);
          if (!platform) {
            return (
              <span
                key={platformId}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-400 text-white"
                aria-label={platformId}
              >
                {platformId}
              </span>
            );
          }
          const Icon = platform.icon;
          const bgClass = platform.tailwindGradient || platform.tailwind;
          return (
            <span
              key={platformId}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${bgClass}`}
              aria-label={platform.label}
            >
              <Icon size={10} color="white" aria-hidden="true" />
              {platform.label}
            </span>
          );
        })}
      </div>
    );
  }

  const limit = maxVisible ?? DEFAULT_MAX_VISIBLE;
  const visible = platforms.length > limit ? platforms.slice(0, limit - 1) : platforms;
  const overflow = platforms.length > limit ? platforms.length - (limit - 1) : 0;
  const { px, radius, gap, iconSize } = sizeConfig[size];

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {visible.map((platformId) => {
        const platform = lookup(platformId);
        if (!platform) {
          return (
            <div
              key={platformId}
              style={{ width: px, height: px, borderRadius: radius }}
              className="bg-gray-400 flex-shrink-0"
              aria-label={platformId}
              role="img"
            />
          );
        }
        const Icon = platform.icon;
        const bgClass = platform.tailwindGradient || platform.tailwind;
        return (
          <div
            key={platformId}
            style={{ width: px, height: px, borderRadius: radius }}
            className={`flex items-center justify-center flex-shrink-0 ${bgClass}`}
            aria-label={platform.label}
            role="img"
          >
            <Icon size={iconSize} color="white" aria-hidden="true" />
          </div>
        );
      })}
      {overflow > 0 && (
        <span
          className="text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            fontSize: size === 'sm' ? 9 : 10,
            fontWeight: 700,
            height: px,
            minWidth: px + 6,
            paddingInline: 4,
          }}
        >
          {COPY.platformBadges.overflow(overflow)}
        </span>
      )}
    </div>
  );
}
