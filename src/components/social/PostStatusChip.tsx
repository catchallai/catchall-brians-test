/**
 * PostStatusChip
 *
 * A reusable status chip for displaying post status with icon, color, and optional tooltip.
 *
 * Props:
 *   - status: PostStatus (required) — the status to display (e.g. 'draft', 'approved', etc.)
 *   - iconOnly: boolean (optional) — if true, only the icon is shown and a tooltip appears on hover
 *   - className: string (optional) — additional classes for the chip
 *
 * Statuses and their colors/icons are defined in STATUS_CONFIG.
 * Status formatting is handled by getFormattedStatus utility.
 */
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BookCheck,
  PencilOff,
  Archive,
  RouteOff,
  Trash2,
} from 'lucide-react';
import { getFormattedStatus } from '../utils/getFormattedStatus'; // Formats status string for display
import Tooltip from '@/components/ui-custom/Tooltip';
import { PostStatus } from '@/types/enums';

export interface PostStatusChipProps {
  status: PostStatus;
  iconOnly?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<PostStatus, { color: string; icon: JSX.Element; text: string }> = {
  [PostStatus.DRAFT]: {
    color: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700',
    icon: <FileText className="w-4 h-4 text-gray-700 dark:text-gray-300" />,
    text: 'text-gray-700 dark:text-gray-300',
  },
  [PostStatus.PENDING_REVIEW]: {
    color: 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30',
    icon: <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />,
    text: 'text-amber-700 dark:text-amber-300',
  },
  [PostStatus.PENDING_APPROVAL]: {
    color: 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30',
    icon: <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />,
    text: 'text-amber-700 dark:text-amber-300',
  },
  [PostStatus.CHANGES_REQUESTED]: {
    color: 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
    icon: <PencilOff className="w-4 h-4 text-red-700 dark:text-red-300" />,
    text: 'text-red-700 dark:text-red-300',
  },
  [PostStatus.SCHEDULED]: {
    color: 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30',
    icon: <Clock className="w-4 h-4 text-blue-700 dark:text-blue-300" />,
    text: 'text-blue-700 dark:text-blue-300',
  },
  [PostStatus.UNUSED]: {
    color: 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
    icon: <RouteOff className="w-4 h-4 text-red-700 dark:text-red-300" />,
    text: 'text-red-700 dark:text-red-300',
  },
  [PostStatus.APPROVED]: {
    color: 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    icon: <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />,
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  [PostStatus.REJECTED]: {
    color: 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
    icon: <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-300" />,
    text: 'text-red-700 dark:text-red-300',
  },
  [PostStatus.PUBLISHED]: {
    color: 'border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/30',
    icon: <BookCheck className="w-4 h-4 text-violet-700 dark:text-violet-300" />,
    text: 'text-violet-700 dark:text-violet-300',
  },
  [PostStatus.ARCHIVED]: {
    color: 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
    icon: <Archive className="w-4 h-4 text-red-700 dark:text-red-300" />,
    text: 'text-red-700 dark:text-red-300',
  },
  [PostStatus.DELETED]: {
    color: 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700',
    icon: <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />,
    text: 'text-gray-500 dark:text-gray-400',
  },
};

export default function PostStatusChip(props: PostStatusChipProps) {
  const { status, iconOnly = false, className } = props;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG[PostStatus.DRAFT]; // Fallback to draft config if status is unrecognized
  const formattedStatus = getFormattedStatus(status);

  const chip = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 border text-xs font-medium rounded-full transition-colors ${config.color} ${config.text} ${className || ''}`}
      aria-label={iconOnly ? formattedStatus : undefined}
      tabIndex={iconOnly ? 0 : undefined}
      role={iconOnly ? 'img' : undefined}
    >
      {config.icon}
      {!iconOnly && <span>{formattedStatus}</span>}
    </span>
  );

  if (iconOnly) {
    return (
      <Tooltip content={formattedStatus} side="top">
        {chip}
      </Tooltip>
    );
  }
  return chip;
}
