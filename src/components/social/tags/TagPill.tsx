import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TagOption } from '@/types/tags';
import COPY from '@/lib/copy';

interface TagPillProps {
  tag: TagOption;
  onRemove?: () => void;
  size?: 'sm' | 'default';
  className?: string;
}

export function TagPill({ tag, onRemove, size = 'default', className }: TagPillProps) {
  const color = tag.color || '#6366f1';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium text-white leading-none',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          aria-label={COPY.tagPill.removeLabel(tag.name)}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full opacity-70 hover:opacity-100 transition-opacity -mr-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
