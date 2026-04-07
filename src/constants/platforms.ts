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
    limit: 280,
  },
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    icon: Linkedin,
    bg: '#0a66c2',
    tailwind: 'bg-blue-700',
    limit: 3000,
  },
  {
    id: 'Facebook',
    label: 'Facebook',
    icon: Facebook,
    bg: '#1877f2',
    tailwind: 'bg-blue-600',
    limit: 63206,
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: Instagram,
    bg: '#e1306c',
    tailwind: 'bg-pink-600',
    limit: 2200,
  },
  {
    id: 'YouTube',
    label: 'YouTube',
    icon: Youtube,
    bg: '#ff0000',
    tailwind: 'bg-red-600',
    limit: 5000,
  },
  {
    id: 'TikTok',
    label: 'TikTok',
    icon: TikTokIcon,
    bg: '#010101',
    tailwind: 'bg-black',
    limit: 2200,
  },
] as const;

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
  PlatformId,
  (typeof PLATFORMS)[number]
>;
