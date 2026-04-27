import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';
import { PLATFORMS } from '@/constants/platforms';

export type PlatformId = (typeof PLATFORMS)[number]['id'];

type PlatformFilterChipsProps = {
  activeFilters: Set<PlatformId>;
  onToggle: (platform: PlatformId) => void;
  className?: string;
};

/**
 * Per-platform Tailwind class bundles.
 *
 * Tailwind JIT scans source files for literal class name matches, so every
 * arbitrary-value class (e.g. `border-[#0a66c2]`) must appear here as a
 * complete, unbroken string. Keep this object in sync with PLATFORMS.
 */
const PLATFORM_CLASS_STRINGS: Record<
  PlatformId,
  { border: string; bg: string; text: string; activeBg: string; activeRing: string }
> = {
  Twitter: {
    border: 'border-black dark:border-white',
    bg: 'bg-black/5 dark:bg-white/10',
    text: 'text-black dark:text-white',
    activeBg: 'bg-black/15 dark:bg-white/20',
    activeRing: 'ring-black/50 dark:ring-white/50',
  },
  LinkedIn: {
    border: 'border-[#0a66c2]',
    bg: 'bg-[#0a66c2]/5 dark:bg-[#0a66c2]/15',
    text: 'text-[#0a66c2] dark:text-[#4a9eff]',
    activeBg: 'bg-[#0a66c2]/15 dark:bg-[#0a66c2]/25',
    activeRing: 'ring-[#0a66c2]/50',
  },
  Facebook: {
    border: 'border-[#1877f2]',
    bg: 'bg-[#1877f2]/5 dark:bg-[#1877f2]/15',
    text: 'text-[#1877f2] dark:text-[#5aa3ff]',
    activeBg: 'bg-[#1877f2]/15 dark:bg-[#1877f2]/25',
    activeRing: 'ring-[#1877f2]/50',
  },
  Instagram: {
    border: 'border-[#e1306c]',
    bg: 'bg-[#e1306c]/5 dark:bg-[#e1306c]/15',
    text: 'text-[#e1306c] dark:text-[#f06090]',
    activeBg: 'bg-[#e1306c]/15 dark:bg-[#e1306c]/25',
    activeRing: 'ring-[#e1306c]/50',
  },
  YouTube: {
    border: 'border-[#ff0000]',
    bg: 'bg-[#ff0000]/5 dark:bg-[#ff0000]/15',
    text: 'text-[#ff0000] dark:text-[#ff5050]',
    activeBg: 'bg-[#ff0000]/15 dark:bg-[#ff0000]/25',
    activeRing: 'ring-[#ff0000]/50',
  },
};

export default function PlatformFilterChips(props: PlatformFilterChipsProps) {
  const { activeFilters, onToggle, className } = props;
  const hasAnyActive = activeFilters.size > 0;

  return (
    <div
      role="group"
      aria-label={COPY.platformFilter.groupLabel}
      className={cn('flex items-center gap-1.5', className)}
    >
      {PLATFORMS.map((platform) => {
        const styles = PLATFORM_CLASS_STRINGS[platform.id];
        const Icon = platform.icon;
        const isActive = activeFilters.has(platform.id);
        const isDimmed = hasAnyActive && !isActive;

        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => onToggle(platform.id)}
            aria-pressed={isActive}
            aria-label={COPY.platformFilter.chipAriaLabel(platform.label)}
            title={platform.label}
            className={cn(
              'w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white focus-visible:ring-gray-400 dark:focus-visible:ring-offset-gray-900 dark:focus-visible:ring-gray-500',
              styles.border,
              isActive ? styles.activeBg : styles.bg,
              styles.text,
              isActive && `ring-2 ring-offset-1 ${styles.activeRing}`,
              isDimmed && 'opacity-60'
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
