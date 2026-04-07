// src/components/ui/PlatformBadges.tsx
import { PLATFORM_MAP } from '@/constants/platforms';
import type { PlatformId } from '@/types/enums';

interface PlatformBadgesProps {
  platforms: string[];
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  className?: string;
}

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

  if (size === 'lg') {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {platforms.map((platformId) => {
          const platform = PLATFORM_MAP[platformId as PlatformId];
          if (!platform) return null;
          const Icon = platform.icon;
          return (
            <span
              key={platformId}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: platform.bg }}
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

  const defaultMax = 4;
  const limit = maxVisible ?? defaultMax;
  const visible = platforms.length > limit ? platforms.slice(0, limit - 1) : platforms;
  const overflow = platforms.length > limit ? platforms.length - (limit - 1) : 0;
  const { px, radius, gap, iconSize } = sizeConfig[size];

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {visible.map((platformId) => {
        const platform = PLATFORM_MAP[platformId as PlatformId];
        if (!platform) {
          return (
            <div
              key={platformId}
              style={{ width: px, height: px, borderRadius: radius }}
              className="bg-gray-400 flex-shrink-0"
              aria-label={platformId}
            />
          );
        }
        const Icon = platform.icon;
        return (
          <div
            key={platformId}
            style={{
              width: px,
              height: px,
              borderRadius: radius,
              backgroundColor: platform.bg,
            }}
            className="flex items-center justify-center flex-shrink-0"
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
          +{overflow}
        </span>
      )}
    </div>
  );
}
