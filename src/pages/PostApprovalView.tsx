import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShieldCheck, MessageSquare, Bell, FileText, ImageOff } from 'lucide-react';
import ApprovalWidget from '@/components/social/approvals/ApprovalWidget';
import { PLATFORMS } from '@/constants/platforms';
import COPY from '@/lib/copy';
import PostApprovalPanel from '@/components/social/PostApprovalPanel';
import PostCommentThread from '@/components/social/approvals/PostCommentThread';
import PostActivityFeed from '@/components/social/approvals/PostActivityFeed';
import WorkflowStageBuilder from '@/components/social/approvals/WorkflowStageBuilder';
import { PostStatus } from '@/types/enums';

export default function PostApprovalView() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('id');
  const [rightPanel, setRightPanel] = useState('approval');
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: post, isLoading } = useQuery({
    queryKey: ['calendar-post', postId],
    queryFn: () => base44.entities.CalendarPost.get(postId),
    enabled: !!postId,
  });

  useEffect(() => {
    if (post?.platforms?.length > 0 && !previewPlatform) {
      setPreviewPlatform(post.platforms[0]);
    }
  }, [post, previewPlatform]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-5 w-40 mb-6" />
        <Skeleton className="h-72 rounded-2xl mb-5" />
        <Skeleton className="h-10 rounded-xl mb-5" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 lg:p-8 text-center text-gray-500 text-sm">
        {COPY.postApprovalView.postNotFound}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-5">
        <Link
          to={createPageUrl('AllChannels')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {COPY.postApprovalView.backToAllChannels}
        </Link>

        {/* Post Preview — platform tabs + preview card matching create-post modal */}
        {post.platforms?.length > 0 &&
          (() => {
            const activePlatform = previewPlatform ?? post.platforms[0];
            const platformCfg = PLATFORMS.find((p) => p.id === activePlatform) ?? PLATFORMS[0];
            const PlatformIcon = platformCfg.icon;

            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                {/* Platform tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                  {PLATFORMS.filter((pl) => post.platforms.includes(pl.id)).map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => setPreviewPlatform(pl.id)}
                      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                        activePlatform === pl.id
                          ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                          : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {pl.id === 'Twitter' ? COPY.calendarPostModal.twitterDisplayName : pl.id}
                    </button>
                  ))}
                </div>

                {/* Preview card header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${platformCfg.tailwind}`}
                  >
                    <PlatformIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {COPY.calendarPostModal.yourAccount}
                    </p>
                    <p className="text-xs text-gray-400">{COPY.calendarPostModal.justNow}</p>
                  </div>
                </div>

                {/* Media */}
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full object-cover" />
                )}
                {post.video_url && !post.image_url && (
                  <video
                    src={post.video_url}
                    className="w-full aspect-[1.91/1] object-cover"
                    muted
                  />
                )}

                {/* Caption + widget */}
                <div className="p-3 flex items-start justify-between gap-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6 flex-1">
                    {post.caption || (
                      <span className="text-gray-300 dark:text-gray-600 italic">
                        {COPY.calendarPostModal.captionPreviewPlaceholder}
                      </span>
                    )}
                  </p>
                  <div className="shrink-0">
                    <ApprovalWidget
                      viewsCount={
                        new Set(
                          (post.workflow_history || []).map((e: any) => e.by_email).filter(Boolean)
                        ).size
                      }
                      approvalsCount={
                        (post.workflow_history || []).filter((e: any) => e.action === 'approved')
                          .length
                      }
                      rejectionsCount={
                        (post.workflow_history || []).filter(
                          (e: any) => e.action === 'rejected' || e.action === 'changes_requested'
                        ).length
                      }
                      dueDate={post.review_due_date}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Rejected media notice */}
        {post.status === PostStatus.REJECTED && (post.image_url || post.video_url) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <ImageOff className="w-4 h-4 shrink-0" />
            {COPY.postApprovalView.mediaRetainedNotice}
          </div>
        )}

        {/* Sub-tab navigation */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
          {[
            { key: 'approval', label: COPY.calendarPostModal.approvalWorkflow, icon: ShieldCheck },
            { key: 'comments', label: COPY.calendarPostModal.comments, icon: MessageSquare },
            { key: 'activity', label: COPY.postApprovalView.activity, icon: Bell },
            { key: 'workflow', label: COPY.postApprovalView.workflow, icon: FileText },
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
              post={post}
              readOnly
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
                queryClient.invalidateQueries({ queryKey: ['calendar-post', postId] });
              }}
            />
          )}
          {rightPanel === 'comments' && <PostCommentThread post={post} currentUser={currentUser} />}
          {rightPanel === 'activity' && <PostActivityFeed post={post} />}
          {rightPanel === 'workflow' && <WorkflowStageBuilder />}
        </div>
      </div>
    </div>
  );
}
