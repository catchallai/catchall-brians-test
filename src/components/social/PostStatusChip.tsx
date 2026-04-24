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
 * Status metadata, colors, and icons come from `@/lib/postStatusConfig`.
 */
import { getFormattedStatus } from '../utils/getFormattedStatus';
import Tooltip from '@/components/ui-custom/Tooltip';
import { PostStatus } from '@/types/enums';
import { POST_STATUS_CONFIG, getPostStatusStyles } from '@/lib/postStatusConfig';

export interface PostStatusChipProps {
  status: PostStatus;
  iconOnly?: boolean;
  className?: string;
}

export default function PostStatusChip(props: PostStatusChipProps) {
  const { status, iconOnly = false, className } = props;

  const config = POST_STATUS_CONFIG[status] ?? POST_STATUS_CONFIG[PostStatus.DRAFT];
  const styles = getPostStatusStyles(status);
  const Icon = config.icon;
  const formattedStatus = getFormattedStatus(status);

  const chip = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 border text-xs font-medium rounded-full transition-colors ${styles.bgClass} ${styles.borderClass} ${styles.textClass} ${className || ''}`}
      aria-label={iconOnly ? formattedStatus : undefined}
      tabIndex={iconOnly ? 0 : undefined}
      role={iconOnly ? 'img' : undefined}
    >
      <Icon className={`w-4 h-4 ${styles.iconClass}`} aria-hidden="true" focusable="false" />
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
