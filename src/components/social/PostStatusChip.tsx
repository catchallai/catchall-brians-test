/**
 * PostStatusChip
 *
 * A reusable status chip for displaying post status with icon, color, and optional tooltip.
 *
 * Props:
 *   - status: PostStatusType (required) — the status to display (e.g. 'draft', 'approved', etc.)
 *   - iconOnly: boolean (optional) — if true, only the icon is shown and a tooltip appears on hover
 *   - className: string (optional) — additional classes for the chip
 *
 * Statuses and their colors/icons are defined in STATUS_CONFIG.
 * Status formatting is handled by getFormattedStatus utility.
 */
import { Clock, CheckCircle, AlertCircle, FileText, BookCheck } from 'lucide-react';
import { getFormattedStatus } from '../utils/getFormattedStatus'; // Formats status string for display

export type PostStatusType =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'unused'
  | 'approved'
  | 'published';

export interface PostStatusChipProps {
  status: PostStatusType;
  iconOnly?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<PostStatusType, { color: string; icon: JSX.Element; text: string }> = {
  draft: {
    color: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700',
    icon: <FileText className="w-4 h-4 text-gray-700 dark:text-gray-300" />,
    text: 'text-gray-700 dark:text-gray-300',
  },
  pending_review: {
    color: 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30',
    icon: <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />,
    text: 'text-amber-700 dark:text-amber-300',
  },
  pending_approval: {
    color: 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30',
    icon: <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />,
    text: 'text-amber-700 dark:text-amber-300',
  },
  unused: {
    color: 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
    icon: <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-300" />,
    text: 'text-red-700 dark:text-red-300',
  },
  approved: {
    color: 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    icon: <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />,
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  published: {
    color: 'border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/30',
    icon: <BookCheck className="w-4 h-4 text-violet-700 dark:text-violet-300" />,
    text: 'text-violet-700 dark:text-violet-300',
  },
};

export default function PostStatusChip(props: PostStatusChipProps) {
  const { status, iconOnly = false, className } = props;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const formattedStatus = getFormattedStatus(status);

  const chip = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 border text-xs font-medium rounded-full transition-colors ${config.color} ${config.text} ${className || ''}`}
    >
      {config.icon}
      {!iconOnly && <span>{formattedStatus}</span>}
    </span>
  );

  if (iconOnly) {
    return (
      <span className="group relative cursor-pointer">
        {chip}
        <span className="absolute z-50 top-1/2 left-full -translate-y-1/2 ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-xl">
          {formattedStatus}
        </span>
      </span>
    );
  }
  return chip;
}
