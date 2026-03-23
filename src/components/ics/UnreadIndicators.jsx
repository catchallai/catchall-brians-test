import { Badge } from '@/components/ui/badge';

export function UnreadBadge({ count }) {
  if (!count || count === 0) {
    return null;
  }
  return (
    <Badge variant="destructive" className="ml-auto text-xs">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

export function ChannelUnreadIndicator({ count, children }) {
  if (!count || count === 0) {
    return children;
  }
  return (
    <div className="relative">
      {children}
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
        {count > 9 ? '9+' : count}
      </div>
    </div>
  );
}

export function MentionIndicator() {
  return (
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
  );
}
