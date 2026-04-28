import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Eye,
  ThumbsUp,
  Clock,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { versionAt } from '@/utils/versionAt';
import COPY from '@/lib/copy';

const ACTION_ICONS = {
  approved: { icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
  rejected: { icon: XCircle, color: 'text-red-500 bg-red-50' },
  changes_requested: { icon: RotateCcw, color: 'text-orange-500 bg-orange-50' },
  submitted_for_review: { icon: Send, color: 'text-yellow-500 bg-yellow-50' },
  submitted_for_approval: { icon: ThumbsUp, color: 'text-blue-500 bg-blue-50' },
  assigned: { icon: Eye, color: 'text-violet-500 bg-violet-50' },
  deleted: { icon: Trash2, color: 'text-red-500 bg-red-50' },
};

export default function ApprovalHistoryTab({ posts, currentUser: _currentUser, statusLabels }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  // Flatten all history entries with post context
  const allEvents = posts
    .flatMap((post) => (post.workflow_history || []).map((entry) => ({ ...entry, post })))
    .filter((e) => e.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .filter((e) => {
      const matchSearch =
        !search ||
        e.post?.caption?.toLowerCase().includes(search.toLowerCase()) ||
        e.by_name?.toLowerCase().includes(search.toLowerCase());
      const matchAction = filterAction === 'all' || e.action === filterAction;
      return matchSearch && matchAction;
    });

  const completedPosts = posts.filter((p) =>
    ['approved', 'published', 'rejected'].includes(p.status)
  );

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviewed', value: completedPosts.length, color: 'text-violet-600' },
          {
            label: 'Approved',
            value: posts.filter((p) => ['approved', 'published'].includes(p.status)).length,
            color: 'text-green-600',
          },
          {
            label: 'Rejected',
            value: posts.filter((p) => p.status === 'rejected').length,
            color: 'text-red-600',
          },
          {
            label: 'Changes Requested',
            value: posts.filter((p) => p.status === 'changes_requested').length,
            color: 'text-orange-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="changes_requested">Changes Requested</SelectItem>
            <SelectItem value="submitted_for_review">Submitted for Review</SelectItem>
            <SelectItem value="submitted_for_approval">Submitted for Approval</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {allEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No history yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {allEvents.map((event, i) => {
              const cfg = ACTION_ICONS[event.action] || {
                icon: Clock,
                color: 'text-gray-400 bg-gray-50',
              };
              const Icon = cfg.icon;
              const postStatus = statusLabels[event.post?.status] || {
                label: event.post?.status,
                color: 'bg-gray-100 text-gray-600',
              };

              return (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {event.by_name || event.by_email}
                      </span>
                      <span className="text-sm text-gray-500">
                        {event.action?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {event.post?.title || event.post?.caption?.slice(0, 60) || 'Untitled Post'}
                    </p>
                    {event.note && (
                      <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        "{event.note}"
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <Badge className={`text-xs ${postStatus.color}`}>{postStatus.label}</Badge>
                    <p className="text-xs text-gray-400 block">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      {' · '}
                      {COPY.postVersion.versionShort(
                        typeof event.version === 'number'
                          ? event.version
                          : versionAt(event.post?.workflow_history, event.timestamp)
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
