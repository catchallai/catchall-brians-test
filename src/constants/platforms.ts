// src/constants/platforms.ts
import { Twitter, Linkedin, Facebook, Instagram, Youtube } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import type { PlatformId } from '@/types/enums';

export const PLATFORMS = [
  {
    id: 'Twitter',
    label: 'X',
    icon: Twitter,
    bg: '#000000',
    tailwind: 'bg-black',
    tailwindGradient: '',
    limit: 280,
  },
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    icon: Linkedin,
    bg: '#0a66c2',
    tailwind: 'bg-blue-700',
    tailwindGradient: '',
    limit: 3000,
  },
  {
    id: 'Facebook',
    label: 'Facebook',
    icon: Facebook,
    bg: '#1877f2',
    tailwind: 'bg-blue-600',
    tailwindGradient: '',
    limit: 63206,
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: Instagram,
    bg: '#e1306c',
    tailwind: 'bg-pink-600',
    tailwindGradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    limit: 2200,
  },
  {
    id: 'YouTube',
    label: 'YouTube',
    icon: Youtube,
    bg: '#ff0000',
    tailwind: 'bg-red-600',
    tailwindGradient: '',
    limit: 5000,
  },
  {
    id: 'TikTok',
    label: 'TikTok',
    icon: TikTokIcon,
    bg: '#010101',
    tailwind: 'bg-black',
    tailwindGradient: '',
    limit: 2200,
  },
] as const;

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
  PlatformId,
  (typeof PLATFORMS)[number]
>;

/** Lowercase-keyed lookup — use for social listening data where platform IDs are lowercase ('twitter', 'youtube', 'tiktok'). */
export const PLATFORM_MAP_LOWER = Object.fromEntries(
  PLATFORMS.map((p) => [p.id.toLowerCase(), p])
) as Record<string, (typeof PLATFORMS)[number]>;
