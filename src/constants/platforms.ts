// src/constants/platforms.ts
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';

export const PLATFORMS = [
  {
    id: 'Twitter',
    label: 'X',
    icon: TwitterIcon,
    bg: '#000000',
    tailwind: 'bg-black',
    tailwindGradient: '',
    limit: 280,
    aspectRatio: 16 / 9,
    cropLabel: '16:9',
  },
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    icon: LinkedInIcon,
    bg: '#0a66c2',
    tailwind: 'bg-blue-700',
    tailwindGradient: '',
    limit: 3000,
    aspectRatio: 1.91,
    cropLabel: '1.91:1',
  },
  {
    id: 'Facebook',
    label: 'Facebook',
    icon: FacebookIcon,
    bg: '#1877f2',
    tailwind: 'bg-blue-600',
    tailwindGradient: '',
    limit: 63206,
    aspectRatio: 1.91,
    cropLabel: '1.91:1',
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: InstagramIcon,
    bg: '#e1306c',
    tailwind: 'bg-pink-600',
    tailwindGradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    limit: 2200,
    aspectRatio: 1,
    cropLabel: '1:1',
  },
  {
    id: 'YouTube',
    label: 'YouTube',
    icon: YouTubeIcon,
    bg: '#ff0000',
    tailwind: 'bg-red-600',
    tailwindGradient: '',
    limit: 5000,
    aspectRatio: 16 / 9,
    cropLabel: '16:9',
  },
] as const;

/**
 * Per-platform aspect ratio presets shown in the image crop drawer.
 * Ratios are deduplicated — where two use cases share a ratio, the more common one is labelled.
 * These are suggestions only; users can still crop freely at any ratio.
 */
export const PLATFORM_CROP_PRESETS: Record<
  string,
  Array<{ label: string; ratio: number; ratioLabel: string }>
> = {
  Twitter: [
    { label: 'Single Image', ratio: 16 / 9, ratioLabel: '16:9' },
    { label: 'In-Stream Photo', ratio: 1.91, ratioLabel: '1.91:1' },
    { label: 'Two Images', ratio: 7 / 8, ratioLabel: '7:8' },
    { label: 'Header / Banner', ratio: 3, ratioLabel: '3:1' },
    { label: 'Profile Picture', ratio: 1, ratioLabel: '1:1' },
    { label: 'Vertical Video', ratio: 9 / 16, ratioLabel: '9:16' },
  ],
  LinkedIn: [
    { label: 'Feed Landscape', ratio: 1.91, ratioLabel: '1.91:1' },
    { label: 'Feed Square', ratio: 1, ratioLabel: '1:1' },
    { label: 'Feed Portrait', ratio: 4 / 5, ratioLabel: '4:5' },
    { label: 'Background / Banner', ratio: 4, ratioLabel: '4:1' },
    { label: 'Vertical Video', ratio: 9 / 16, ratioLabel: '9:16' },
  ],
  Facebook: [
    { label: 'Feed Landscape', ratio: 1.91, ratioLabel: '1.91:1' },
    { label: 'Feed Square', ratio: 1, ratioLabel: '1:1' },
    { label: 'Stories', ratio: 9 / 16, ratioLabel: '9:16' },
    { label: 'Cover Photo', ratio: 2.7, ratioLabel: '2.7:1' },
    { label: 'Event Cover', ratio: 16 / 9, ratioLabel: '16:9' },
  ],
  Instagram: [
    { label: 'Feed Square', ratio: 1, ratioLabel: '1:1' },
    { label: 'Feed Portrait', ratio: 4 / 5, ratioLabel: '4:5' },
    { label: 'Feed Landscape', ratio: 1.91, ratioLabel: '1.91:1' },
    { label: 'Stories & Reels', ratio: 9 / 16, ratioLabel: '9:16' },
  ],
  YouTube: [
    { label: 'Video / Thumbnail', ratio: 16 / 9, ratioLabel: '16:9' },
    { label: 'Shorts', ratio: 9 / 16, ratioLabel: '9:16' },
    { label: 'Profile Picture', ratio: 1, ratioLabel: '1:1' },
  ],
};

export type SafeZoneSpec =
  | { type: 'center-ratio'; ratio: number }
  | { type: 'center-ratio-top'; ratio: number }
  | { type: 'avoid-bands'; top: number; bottom: number };

/**
 * Safe zone overlays shown as dashed lines on the crop canvas.
 * Keyed by platform ID → ratioLabel (matching PLATFORM_CROP_PRESETS).
 */
export const PLATFORM_SAFE_ZONES: Record<string, Record<string, SafeZoneSpec[]>> = {
  Twitter: {
    '1.91:1': [{ type: 'center-ratio', ratio: 16 / 9 }],
    '7:8': [{ type: 'center-ratio', ratio: 16 / 9 }],
    '3:1': [{ type: 'center-ratio', ratio: 16 / 9 }],
    '1:1': [{ type: 'center-ratio', ratio: 16 / 9 }],
    '9:16': [{ type: 'center-ratio', ratio: 16 / 9 }],
  },
  LinkedIn: {
    '4:5': [{ type: 'center-ratio-top', ratio: 1.91 }],
  },
  Facebook: {
    '9:16': [{ type: 'avoid-bands', top: 0.14, bottom: 0.12 }],
  },
  Instagram: {
    '4:5': [{ type: 'center-ratio', ratio: 1 }],
    '1.91:1': [{ type: 'center-ratio', ratio: 1 }],
    '9:16': [
      { type: 'center-ratio', ratio: 1 },
      { type: 'avoid-bands', top: 0.15, bottom: 0.15 },
    ],
  },
  YouTube: {
    '9:16': [{ type: 'center-ratio', ratio: 4 / 5 }],
    '16:9': [{ type: 'center-ratio', ratio: 3.7 }],
  },
};

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
  string,
  (typeof PLATFORMS)[number]
>;

/** Lowercase-keyed lookup — use for data where platform IDs are stored lowercase ('twitter', 'youtube'). */
export const PLATFORM_MAP_LOWER = Object.fromEntries(
  PLATFORMS.map((p) => [p.id.toLowerCase(), p])
) as Record<string, (typeof PLATFORMS)[number]>;
