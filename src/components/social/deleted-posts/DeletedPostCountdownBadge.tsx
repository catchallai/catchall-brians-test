import { Badge } from '@/components/ui/badge';
import { daysUntilPurge } from '@/utils/deletedPostTimer';
import COPY from '@/lib/copy';

type Props = {
  purgeAt: string | null | undefined;
};

const DeletedPostCountdownBadge = ({ purgeAt }: Props) => {
  if (!purgeAt) return null;
  const days = daysUntilPurge(purgeAt);
  const label =
    days <= 0
      ? COPY.deletedPosts.countdown.purgePending
      : COPY.deletedPosts.countdown.daysLeft(days);
  const ariaLabel = days <= 0 ? label : COPY.deletedPosts.countdown.ariaLabel(days);
  const urgent = days < 3 && days > 0;
  const className = urgent
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <Badge
      variant="outline"
      className={`text-xs px-2 py-0 ${className}`}
      aria-label={ariaLabel}
      role="status"
    >
      {label}
    </Badge>
  );
};

export default DeletedPostCountdownBadge;
