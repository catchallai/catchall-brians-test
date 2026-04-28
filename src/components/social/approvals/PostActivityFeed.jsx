import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  ThumbsUp,
  Eye,
  UserPlus,
  MessageSquare,
  Clock,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { versionAt } from '@/utils/versionAt';
import COPY from '@/lib/copy';

const ACTION_CONFIG = {
  comment: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', label: 'commented' },
  approved: { icon: CheckCircle2, color: 'bg-green-100 text-green-600', label: 'approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-600', label: 'rejected' },
  changes_requested: {
    icon: RotateCcw,
    color: 'bg-orange-100 text-orange-600',
    label: 'requested changes',
  },
  submitted_for_review: {
    icon: Send,
    color: 'bg-yellow-100 text-yellow-600',
    label: 'submitted for review',
  },
  submitted_for_approval: {
    icon: ThumbsUp,
    color: 'bg-blue-100 text-blue-600',
    label: 'sent for approval',
  },
  assigned: { icon: UserPlus, color: 'bg-violet-100 text-violet-600', label: 'assigned reviewer' },
  viewed: { icon: Eye, color: 'bg-gray-100 text-gray-500', label: 'viewed' },
};

export default function PostActivityFeed({ post }) {
  const events = [...(post.workflow_history || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Activity Feed</h3>
        <Badge variant="outline" className="text-xs">
          {events.length}
        </Badge>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {events.map((event, i) => {
          const cfg = ACTION_CONFIG[event.action] || {
            icon: Clock,
            color: 'bg-gray-100 text-gray-500',
            label: event.action?.replace(/_/g, ' '),
          };
          const Icon = cfg.icon;

          return (
            <div
              key={i}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {event.by_name || event.by_email}
                  </span>
                  <span className="text-sm text-gray-500">{cfg.label}</span>
                </div>
                {event.action === 'comment' && event.text && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
                    "{event.text}"
                  </p>
                )}
                {event.note && event.action !== 'comment' && (
                  <p className="text-xs text-gray-500 italic mt-0.5">"{event.note}"</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  {' · '}
                  {COPY.postVersion.versionShort(
                    typeof event.version === 'number'
                      ? event.version
                      : versionAt(post.workflow_history, event.timestamp)
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
