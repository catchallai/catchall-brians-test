import React, { useState } from 'react';
import { UserRole } from '@/types/enums';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Eye, CheckCircle2, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { normalizeReviewers } from '@/utils/reviewers';
import PostApprovalPanel from '@/components/social/PostApprovalPanel';

export default function ApprovalReviewTab({
  posts,
  currentUser,
  selectedPost,
  onSelectPost,
  statusLabels,
}) {
  const [search, setSearch] = useState('');

  const reviewPosts = posts
    .filter((p) => ['pending_approval', 'pending_review', 'changes_requested'].includes(p.status))
    .filter(
      (p) =>
        !search ||
        p.caption?.toLowerCase().includes(search.toLowerCase()) ||
        p.title?.toLowerCase().includes(search.toLowerCase())
    );

  const role = currentUser?.social_media_role || currentUser?.role || UserRole.VIEWER;
  const isAdmin = role === UserRole.ADMIN;

  const myQueue = reviewPosts.filter(
    (p) => normalizeReviewers(p).some((r) => r.email === currentUser?.email) || isAdmin
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: My Review Queue */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">My Review Queue</h2>
          <Badge variant="outline">{myQueue.length} items</Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="space-y-3">
          {myQueue.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No items to review</p>
            </div>
          )}
          {myQueue.map((post) => {
            const isSelected = selectedPost?.id === post.id;
            const status = statusLabels[post.status] || {
              label: post.status,
              color: 'bg-gray-100 text-gray-600',
            };
            const lastEvent = post.workflow_history?.[post.workflow_history.length - 1];

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(isSelected ? null : post)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 shadow-md'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {post.title || post.caption?.slice(0, 70) || 'Untitled'}
                  </p>
                  <Badge className={`text-xs shrink-0 ${status.color}`}>{status.label}</Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {(() => {
                    const revs = normalizeReviewers(post);
                    if (revs.length === 0) return null;
                    const first = revs[0];
                    return (
                      <span className="flex items-center gap-1">
                        <Avatar className="w-4 h-4">
                          <AvatarFallback className="text-[9px] bg-violet-100 text-violet-600">
                            {first.name?.[0] || first.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {first.name || first.email}
                        {revs.length > 1 && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 ml-0.5">
                            +{revs.length - 1}
                          </Badge>
                        )}
                      </span>
                    );
                  })()}
                  {post.scheduled_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.scheduled_date), 'MMM d')}
                    </span>
                  )}
                  {lastEvent && (
                    <span>
                      {formatDistanceToNow(new Date(lastEvent.timestamp), { addSuffix: true })}
                    </span>
                  )}
                </div>

                {/* Workflow progress */}
                <div className="flex items-center gap-1 mt-3">
                  {['draft', 'pending_approval', 'approved'].map((s, i) => {
                    const stages = ['draft', 'pending_approval', 'approved'];
                    const normalizedStatus =
                      post.status === 'pending_review' ? 'pending_approval' : post.status;
                    const currentIdx = stages.indexOf(normalizedStatus);
                    const done = i < currentIdx;
                    const current = i === currentIdx;
                    return (
                      <React.Fragment key={s}>
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            done
                              ? 'bg-green-500'
                              : current
                                ? 'bg-violet-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                        {i < stages.length - 1 && (
                          <div className="flex-1 h-0.5 bg-gray-100 dark:bg-gray-700" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Panel */}
      <div className="lg:col-span-3">
        {!selectedPost ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400">
            <Eye className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Select a post to review</p>
          </div>
        ) : (
          <div className="space-y-5">
            {selectedPost.image_url && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <img
                  src={selectedPost.image_url}
                  alt=""
                  className="w-full max-h-64 object-contain bg-black"
                />
                <div className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPost.caption}</p>
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <PostApprovalPanel post={selectedPost} onUpdate={() => {}} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
