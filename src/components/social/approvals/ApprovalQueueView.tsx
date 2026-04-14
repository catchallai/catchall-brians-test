import type { ComponentProps } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostPriority } from '@/types/enums';
import { UserPlus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// shadcn components ship as .jsx without TypeScript types; cast to usable FC signatures
const TypedAvatar = Avatar as React.FC<ComponentProps<'span'>>;
const TypedAvatarFallback = AvatarFallback as React.FC<ComponentProps<'span'>>;

const PRIORITY_COLORS: Record<PostPriority, string> = {
  [PostPriority.LOW]: 'bg-gray-100 text-gray-500',
  [PostPriority.NORMAL]: 'bg-blue-100 text-blue-600',
  [PostPriority.HIGH]: 'bg-orange-100 text-orange-600',
  [PostPriority.URGENT]: 'bg-red-100 text-red-600',
};

interface ReviewerInfo {
  name?: string | null;
  email?: string | null;
  assignedDate?: string | null;
}

interface ApprovalQueueViewProps {
  reviewer?: ReviewerInfo | null;
  priority?: PostPriority | null;
  dueDate?: string | null;
  note?: string | null;
}

export default function ApprovalQueueView({
  reviewer,
  priority,
  dueDate,
  note,
}: ApprovalQueueViewProps) {
  return (
    <div className="space-y-4">
      {/* Assignment & Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reviewer */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Reviewer
          </p>
          {reviewer?.email ? (
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <TypedAvatar className="w-7 h-7">
                <TypedAvatarFallback className="text-xs bg-blue-200 text-blue-700">
                  {reviewer.name?.[0] ?? reviewer.email[0].toUpperCase()}
                </TypedAvatarFallback>
              </TypedAvatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {reviewer.name || reviewer.email}
                </p>
                {reviewer.assignedDate && (
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(reviewer.assignedDate), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Not assigned</p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</p>
          {priority ? (
            <Badge variant="default" className={`capitalize ${PRIORITY_COLORS[priority]}`}>
              {priority}
            </Badge>
          ) : (
            <p className="text-sm text-gray-400 italic">Not set</p>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</p>
          {dueDate ? (
            <p className="text-sm text-gray-700">{format(new Date(dueDate), 'MMM d, yyyy')}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Not set</p>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</p>
        {note ? (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 whitespace-pre-wrap">
            {note}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No note</p>
        )}
      </div>
    </div>
  );
}
