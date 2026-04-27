import {
  Archive,
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  Clock,
  FileText,
  MessageSquareWarning,
  Send,
  Trash2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { PostStatus } from '@/types/enums';

type PostStatusHue =
  | 'slate'
  | 'amber'
  | 'orange'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'red'
  | 'zinc'
  | 'stone'
  | 'neutral-dark';

type PostStatusConfig = {
  label: string;
  description: string;
  icon: LucideIcon;
  hue: PostStatusHue;
};

type PostStatusStyles = {
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconClass: string;
  leftBorderClass: string;
  activeRingClass: string;
};

const HUE_STYLES: Record<PostStatusHue, PostStatusStyles> = {
  slate: {
    bgClass: 'bg-slate-50 dark:bg-slate-900/40',
    borderClass: 'border-slate-300 dark:border-slate-600',
    textClass: 'text-slate-700 dark:text-slate-300',
    iconClass: 'text-slate-600 dark:text-slate-400',
    leftBorderClass: 'border-l-slate-400 dark:border-l-slate-500',
    activeRingClass: 'ring-slate-400 dark:ring-slate-500',
  },
  amber: {
    bgClass: 'bg-amber-50 dark:bg-amber-900/30',
    borderClass: 'border-amber-300 dark:border-amber-600',
    textClass: 'text-amber-800 dark:text-amber-200',
    iconClass: 'text-amber-600 dark:text-amber-300',
    leftBorderClass: 'border-l-amber-400 dark:border-l-amber-500',
    activeRingClass: 'ring-amber-400 dark:ring-amber-500',
  },
  orange: {
    bgClass: 'bg-orange-50 dark:bg-orange-900/30',
    borderClass: 'border-orange-300 dark:border-orange-600',
    textClass: 'text-orange-800 dark:text-orange-200',
    iconClass: 'text-orange-600 dark:text-orange-300',
    leftBorderClass: 'border-l-orange-400 dark:border-l-orange-500',
    activeRingClass: 'ring-orange-400 dark:ring-orange-500',
  },
  green: {
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    borderClass: 'border-green-300 dark:border-green-600',
    textClass: 'text-green-800 dark:text-green-200',
    iconClass: 'text-green-600 dark:text-green-300',
    leftBorderClass: 'border-l-green-400 dark:border-l-green-500',
    activeRingClass: 'ring-green-400 dark:ring-green-500',
  },
  blue: {
    bgClass: 'bg-blue-50 dark:bg-blue-900/30',
    borderClass: 'border-blue-300 dark:border-blue-600',
    textClass: 'text-blue-800 dark:text-blue-200',
    iconClass: 'text-blue-600 dark:text-blue-300',
    leftBorderClass: 'border-l-blue-400 dark:border-l-blue-500',
    activeRingClass: 'ring-blue-400 dark:ring-blue-500',
  },
  indigo: {
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/30',
    borderClass: 'border-indigo-300 dark:border-indigo-600',
    textClass: 'text-indigo-800 dark:text-indigo-200',
    iconClass: 'text-indigo-600 dark:text-indigo-300',
    leftBorderClass: 'border-l-indigo-400 dark:border-l-indigo-500',
    activeRingClass: 'ring-indigo-400 dark:ring-indigo-500',
  },
  red: {
    bgClass: 'bg-red-50 dark:bg-red-900/30',
    borderClass: 'border-red-300 dark:border-red-600',
    textClass: 'text-red-800 dark:text-red-200',
    iconClass: 'text-red-600 dark:text-red-300',
    leftBorderClass: 'border-l-red-400 dark:border-l-red-500',
    activeRingClass: 'ring-red-400 dark:ring-red-500',
  },
  zinc: {
    bgClass: 'bg-zinc-50 dark:bg-zinc-900/40',
    borderClass: 'border-zinc-300 dark:border-zinc-600',
    textClass: 'text-zinc-700 dark:text-zinc-300',
    iconClass: 'text-zinc-600 dark:text-zinc-400',
    leftBorderClass: 'border-l-zinc-400 dark:border-l-zinc-500',
    activeRingClass: 'ring-zinc-400 dark:ring-zinc-500',
  },
  stone: {
    bgClass: 'bg-stone-50 dark:bg-stone-900/40',
    borderClass: 'border-stone-300 dark:border-stone-600',
    textClass: 'text-stone-700 dark:text-stone-300',
    iconClass: 'text-stone-600 dark:text-stone-400',
    leftBorderClass: 'border-l-stone-400 dark:border-l-stone-500',
    activeRingClass: 'ring-stone-400 dark:ring-stone-500',
  },
  'neutral-dark': {
    bgClass: 'bg-neutral-100 dark:bg-neutral-900',
    borderClass: 'border-neutral-800 dark:border-neutral-700',
    textClass: 'text-neutral-900 dark:text-neutral-100',
    iconClass: 'text-neutral-700 dark:text-neutral-300',
    leftBorderClass: 'border-l-neutral-800 dark:border-l-neutral-700',
    activeRingClass: 'ring-neutral-600 dark:ring-neutral-400',
  },
};

export const POST_STATUS_CONFIG: Record<PostStatus, PostStatusConfig> = {
  [PostStatus.DRAFT]: {
    label: 'Draft',
    description: 'Not yet submitted for approval',
    icon: FileText,
    hue: 'slate',
  },
  [PostStatus.PENDING_APPROVAL]: {
    label: 'Pending Approval',
    description: 'Waiting for a reviewer to approve or request changes',
    icon: Clock,
    hue: 'amber',
  },
  [PostStatus.CHANGES_REQUESTED]: {
    label: 'Changes Requested',
    description: 'A reviewer has requested edits before approval',
    icon: MessageSquareWarning,
    hue: 'orange',
  },
  [PostStatus.APPROVED]: {
    label: 'Approved',
    description: 'Approved by a reviewer and ready to schedule or publish',
    icon: CheckCircle2,
    hue: 'green',
  },
  [PostStatus.SCHEDULED]: {
    label: 'Scheduled',
    description: 'Queued to publish at a future date and time',
    icon: CalendarClock,
    hue: 'blue',
  },
  [PostStatus.PUBLISHED]: {
    label: 'Published',
    description: 'Live on the connected platform',
    icon: Send,
    hue: 'indigo',
  },
  [PostStatus.REJECTED]: {
    label: 'Rejected',
    description: 'Rejected by a reviewer and will not be published',
    icon: XCircle,
    hue: 'red',
  },
  [PostStatus.UNUSED]: {
    label: 'Unused',
    description: 'No longer part of the active publishing plan',
    icon: CircleSlash,
    hue: 'zinc',
  },
  [PostStatus.ARCHIVED]: {
    label: 'Archived',
    description: 'Moved to the archive for long-term retention',
    icon: Archive,
    hue: 'stone',
  },
  [PostStatus.DELETED]: {
    label: 'Deleted',
    description: 'Soft-deleted and awaiting permanent purge',
    icon: Trash2,
    hue: 'neutral-dark',
  },
};

/**
 * Checks whether a raw status value is one of the known post statuses.
 */
function isPostStatus(status: string): status is PostStatus {
  return status in POST_STATUS_CONFIG;
}

/**
 * Returns the class-token bundle for a given status. Falls back to the
 * Draft bundle if the status string is unrecognized (defensive — TypeScript
 * prevents drift for known enum members, but this guards against raw data
 * coming in with unexpected values).
 */
export function getPostStatusStyles(status: PostStatus | string): PostStatusStyles {
  const normalizedStatus = isPostStatus(status) ? status : PostStatus.DRAFT;
  const config = POST_STATUS_CONFIG[normalizedStatus];
  return HUE_STYLES[config.hue];
}

export const LEGEND_VISIBLE_STATUSES: readonly PostStatus[] = [
  PostStatus.DRAFT,
  PostStatus.PENDING_APPROVAL,
  PostStatus.CHANGES_REQUESTED,
  PostStatus.APPROVED,
  PostStatus.SCHEDULED,
  PostStatus.PUBLISHED,
  PostStatus.REJECTED,
  PostStatus.UNUSED,
];
