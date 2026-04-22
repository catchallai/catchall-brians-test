import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  CheckCircle2,
  Eye,
  Search,
  Image,
  Video,
  FileText,
  Timer,
  Bell,
  MessageSquare,
  Calendar,
  ShieldCheck,
  ImageOff,
} from 'lucide-react';
import { format, differenceInSeconds, parseISO } from 'date-fns';
import PostApprovalPanel from '@/components/social/PostApprovalPanel';
import PostCommentThread from '@/components/social/approvals/PostCommentThread';
import PostActivityFeed from '@/components/social/approvals/PostActivityFeed';
import WorkflowStageBuilder from '@/components/social/approvals/WorkflowStageBuilder';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700 animate-pulse',
};

function DeadlineTimer({ dueDate }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!dueDate) {
    return null;
  }
  const deadline = parseISO(dueDate + 'T23:59:59');
  const secsLeft = differenceInSeconds(deadline, now);
  const overdue = secsLeft < 0;
  const urgent = secsLeft < 86400 && !overdue; // < 24h

  const absS = Math.abs(secsLeft);
  const h = Math.floor(absS / 3600);
  const m = Math.floor((absS % 3600) / 60);
  const s = absS % 60;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-mono font-semibold rounded-lg px-2 py-1 ${
        overdue
          ? 'bg-red-100 text-red-700'
          : urgent
            ? 'bg-orange-100 text-orange-700'
            : 'bg-gray-100 text-gray-600'
      }`}
    >
      <Timer className="w-3 h-3" />
      {overdue ? 'OVERDUE ' : ''}
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      {!overdue && ' left'}
    </div>
  );
}

export default function ApprovalQueueTab({
  posts,
  currentUser,
  selectedPost,
  onSelectPost,
  statusLabels,
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [_photoSwipeIdx, setPhotoSwipeIdx] = useState(0);
  const [rightPanel, setRightPanel] = useState('approval'); // 'approval' | 'comments' | 'activity' | 'workflow'

  const queuePosts = posts
    .filter((p) =>
      ['pending_approval', 'pending_review', 'changes_requested', 'draft'].includes(p.status)
    )
    .filter((p) => {
      const matchSearch =
        !search ||
        p.caption?.toLowerCase().includes(search.toLowerCase()) ||
        p.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchPriority = filterPriority === 'all' || p.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });

  const _updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
    },
  });

  const _addHistoryEntry = (post, action, extra = {}) => {
    const history = post.workflow_history || [];
    return {
      workflow_history: [
        ...history,
        {
          action,
          by_email: currentUser?.email,
          by_name: currentUser?.full_name || currentUser?.email,
          timestamp: new Date().toISOString(),
        },
      ],
      ...extra,
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Queue List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="changes_requested">Changes Needed</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9 w-32 text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue Items */}
        <div className="space-y-3">
          {queuePosts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No posts in queue</p>
            </div>
          )}
          {queuePosts.map((post) => {
            const isSelected = selectedPost?.id === post.id;
            const status = statusLabels[post.status] || {
              label: post.status,
              color: 'bg-gray-100 text-gray-600',
            };
            return (
              <div
                key={post.id}
                onClick={() => {
                  onSelectPost(isSelected ? null : post);
                  setPhotoSwipeIdx(0);
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 shadow-md'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Media thumb */}
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    ) : post.media_type === 'video' ? (
                      <Video className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Image className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                      {post.priority && post.priority !== 'normal' && (
                        <Badge className={`text-xs ${PRIORITY_COLORS[post.priority]}`}>
                          {post.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {post.title || post.caption?.slice(0, 80) || 'Untitled Post'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.scheduled_date
                          ? format(new Date(post.scheduled_date), 'MMM d')
                          : 'No date'}
                      </span>
                      {post.platforms?.length > 0 && (
                        <span>
                          {post.platforms.slice(0, 2).join(', ')}
                          {post.platforms.length > 2 ? `+${post.platforms.length - 2}` : ''}
                        </span>
                      )}
                    </div>
                    {post.review_due_date && (
                      <div className="mt-2">
                        <DeadlineTimer dueDate={post.review_due_date} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Review Panel */}
      <div className="lg:col-span-3">
        {!selectedPost ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400">
            <Eye className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Select a post to review</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Post Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {/* Media Swiper (images only) */}
              {selectedPost.image_url && (
                <div className="relative bg-black">
                  <img
                    src={selectedPost.image_url}
                    alt=""
                    className="w-full max-h-72 object-contain"
                  />
                </div>
              )}
              {selectedPost.video_url && (
                <video src={selectedPost.video_url} controls className="w-full max-h-72 bg-black" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    {selectedPost.title && (
                      <h2 className="font-bold text-gray-900 dark:text-white mb-1">
                        {selectedPost.title}
                      </h2>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPost.caption}
                    </p>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    {selectedPost.scheduled_date && (
                      <p className="text-xs text-gray-400">
                        {format(new Date(selectedPost.scheduled_date), 'MMM d, yyyy')}
                        {selectedPost.scheduled_time && ` @ ${selectedPost.scheduled_time}`}
                      </p>
                    )}
                    {selectedPost.review_due_date && (
                      <DeadlineTimer dueDate={selectedPost.review_due_date} />
                    )}
                  </div>
                </div>
                {selectedPost.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedPost.hashtags.map((h, i) => (
                      <span
                        key={i}
                        className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded"
                      >
                        #{h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rejected media notice */}
            {selectedPost.status === 'rejected' &&
              (selectedPost.image_url || selectedPost.video_url) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <ImageOff className="w-4 h-4 shrink-0" />
                  Media retained for version history — <strong>not</strong> transferred to the
                  Approved Media Database.
                </div>
              )}

            {/* Sub-tab navigation */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
              {[
                { key: 'approval', label: 'Approval', icon: ShieldCheck },
                { key: 'comments', label: 'Comments', icon: MessageSquare },
                { key: 'activity', label: 'Activity', icon: Bell },
                { key: 'workflow', label: 'Workflow', icon: FileText },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setRightPanel(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    rightPanel === key
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              {rightPanel === 'approval' && (
                <PostApprovalPanel
                  post={selectedPost}
                  onUpdate={() =>
                    queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] })
                  }
                />
              )}
              {rightPanel === 'comments' && (
                <PostCommentThread post={selectedPost} currentUser={currentUser} />
              )}
              {rightPanel === 'activity' && <PostActivityFeed post={selectedPost} />}
              {rightPanel === 'workflow' && <WorkflowStageBuilder />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
