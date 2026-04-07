// src/constants/platforms.ts
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';
import type { PlatformId } from '@/types/enums';

export const PLATFORMS = [
  {
    id: 'Twitter',
    label: 'X',
    icon: TwitterIcon,
    bg: '#000000',
    tailwind: 'bg-black',
    tailwindGradient: '',
    limit: 280,
  },
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    icon: LinkedInIcon,
    bg: '#0a66c2',
    tailwind: 'bg-blue-700',
    tailwindGradient: '',
    limit: 3000,
  },
  {
    id: 'Facebook',
    label: 'Facebook',
    icon: FacebookIcon,
    bg: '#1877f2',
    tailwind: 'bg-blue-600',
    tailwindGradient: '',
    limit: 63206,
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: InstagramIcon,
    bg: '#e1306c',
    tailwind: 'bg-pink-600',
    tailwindGradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    limit: 2200,
  },
  {
    id: 'YouTube',
    label: 'YouTube',
    icon: YouTubeIcon,
    bg: '#ff0000',
    tailwind: 'bg-red-600',
    tailwindGradient: '',
    limit: 5000,
  },
] as const;

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
  PlatformId,
  (typeof PLATFORMS)[number]
>;

/** Lowercase-keyed lookup — use for data where platform IDs are stored lowercase ('twitter', 'youtube'). */
export const PLATFORM_MAP_LOWER = Object.fromEntries(
  PLATFORMS.map((p) => [p.id.toLowerCase(), p])
) as Record<string, (typeof PLATFORMS)[number]>;
