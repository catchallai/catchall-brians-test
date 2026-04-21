import type { ComponentProps, FC } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostPriority } from '@/types/enums';
import { ReviewerApprovalStatus } from '@/types/reviewers';
import type { ReviewerEntry } from '@/types/reviewers';
import { UserPlus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import COPY from '@/lib/copy';

// shadcn components ship as .jsx without TypeScript types; cast to usable FC signatures
const TypedAvatar = Avatar as FC<ComponentProps<'span'>>;
const TypedAvatarFallback = AvatarFallback as FC<ComponentProps<'span'>>;

const PRIORITY_COLORS: Record<PostPriority, string> = {
  [PostPriority.LOW]: 'bg-gray-100 text-gray-500',
  [PostPriority.NORMAL]: 'bg-blue-100 text-blue-600',
  [PostPriority.HIGH]: 'bg-orange-100 text-orange-600',
  [PostPriority.URGENT]: 'bg-red-100 text-red-600',
};

const STATUS_BADGE: Record<ReviewerApprovalStatus, { label: string; className: string }> = {
  [ReviewerApprovalStatus.PENDING]: {
    label: COPY.reviewerStatus.pending,
    className: 'bg-gray-100 text-gray-500',
  },
  [ReviewerApprovalStatus.APPROVED]: {
    label: COPY.reviewerStatus.approved,
    className: 'bg-green-100 text-green-700',
  },
  [ReviewerApprovalStatus.REJECTED]: {
    label: COPY.reviewerStatus.rejected,
    className: 'bg-red-100 text-red-600',
  },
  [ReviewerApprovalStatus.CHANGES_REQUESTED]: {
    label: COPY.reviewerStatus.changes_requested,
    className: 'bg-orange-100 text-orange-600',
  },
};

interface ApprovalQueueViewProps {
  reviewers?: ReviewerEntry[];
  priority?: PostPriority | null;
  dueDate?: string | null;
  note?: string | null;
}

export default function ApprovalQueueView({
  reviewers = [],
  priority,
  dueDate,
  note,
}: ApprovalQueueViewProps) {
  return (
    <div className="space-y-4">
      {/* Assignment & Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reviewers */}
        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> {COPY.approvalQueueView.reviewer}
          </p>
          {reviewers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {reviewers.map((r) => {
                const badge =
                  STATUS_BADGE[r.status] ?? STATUS_BADGE[ReviewerApprovalStatus.PENDING];
                return (
                  <div
                    key={r.email}
                    className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100"
                  >
                    <TypedAvatar className="w-6 h-6">
                      <TypedAvatarFallback className="text-[10px] bg-blue-200 text-blue-700">
                        {r.name?.[0]?.toUpperCase() ?? r.email[0].toUpperCase()}
                      </TypedAvatarFallback>
                    </TypedAvatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {r.name || r.email}
                      </p>
                      {r.assigned_date && (
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(r.assigned_date), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <Badge variant="default" className={`text-[10px] shrink-0 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">{COPY.approvalQueueView.notAssigned}</p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {COPY.approvalQueueView.priority}
          </p>
          {priority ? (
            <Badge variant="default" className={`capitalize ${PRIORITY_COLORS[priority]}`}>
              {priority}
            </Badge>
          ) : (
            <p className="text-sm text-gray-400 italic">{COPY.approvalQueueView.notSet}</p>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {COPY.approvalQueueView.dueDate}
          </p>
          {dueDate ? (
            <p className="text-sm text-gray-700">
              {format(new Date(dueDate + 'T00:00:00'), 'MMM d, yyyy')}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">{COPY.approvalQueueView.notSet}</p>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {COPY.approvalQueueView.note}
        </p>
        {note ? (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 whitespace-pre-wrap">
            {note}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">{COPY.approvalQueueView.noNote}</p>
        )}
      </div>
    </div>
  );
}
