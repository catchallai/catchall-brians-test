import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, CheckCircle, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PostComments({
  postId,
  post,
  currentUser,
  pendingAction = null,
  onPendingActionComplete,
  onPendingActionCancel,
}) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => base44.entities.PostComment.filter({ post_id: postId }, '-created_date'),
    enabled: !!postId,
  });

  const workflowMutation = useMutation({
    mutationFn: ({ action, commentText }) => {
      const history = post?.workflow_history || [];
      const workflowEvent = {
        action,
        by_email: currentUser?.email,
        by_name: currentUser?.full_name || currentUser?.email,
        timestamp: new Date().toISOString(),
      };
      const statusUpdate =
        action === 'rejected'
          ? { status: 'rejected', rejected_reason: commentText, media_approved: false }
          : { status: 'changes_requested' };
      return base44.entities.CalendarPost.update(post.id, {
        workflow_history: [...history, workflowEvent],
        ...statusUpdate,
      });
    },
    onSuccess: () => {
      if (onPendingActionComplete) {
        onPendingActionComplete();
      }
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.PostComment.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setNewComment('');
      if (pendingAction && post) {
        workflowMutation.mutate({
          action: pendingAction,
          commentText: variables.comment,
        });
      }
    },
  });

  const toggleResolveMutation = useMutation({
    mutationFn: ({ id, resolved }) => base44.entities.PostComment.update(id, { resolved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      return;
    }

    addCommentMutation.mutate({
      post_id: postId,
      comment: newComment,
      is_internal: true,
    });
  };

  const canManageComments =
    currentUser?.role === 'admin' || currentUser?.social_media_role === 'admin';

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <MessageSquare className="w-4 h-4" />
        Team Feedback ({comments.length})
      </div>

      {/* Pending action banner */}
      {pendingAction && (
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
            pendingAction === 'rejected'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-orange-50 border border-orange-200 text-orange-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {pendingAction === 'rejected' ? (
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="font-medium">
              {pendingAction === 'rejected'
                ? 'Leave a comment explaining the rejection to submit it.'
                : 'Leave a comment explaining the requested changes to submit it.'}
            </span>
          </div>
          <button
            onClick={onPendingActionCancel}
            className="text-gray-400 hover:text-gray-600 font-medium ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.resolved
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                    {comment.created_by?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.created_by?.split('@')[0]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                    </span>
                    {comment.resolved && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                  {canManageComments && (
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id={`resolve-${comment.id}`}
                        checked={comment.resolved}
                        onCheckedChange={(checked) =>
                          toggleResolveMutation.mutate({ id: comment.id, resolved: checked })
                        }
                      />
                      <label
                        htmlFor={`resolve-${comment.id}`}
                        className="text-xs text-gray-500 cursor-pointer"
                      >
                        Mark as resolved
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {currentUser?.social_media_role !== 'viewer' && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add feedback or comment..."
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Comment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
