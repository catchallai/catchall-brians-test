import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import COPY from '@/lib/copy';

export default function PostComments({ postId, currentUser }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => base44.entities.PostComment.filter({ post_id: postId }, '-created_date'),
    enabled: !!postId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.PostComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setNewComment('');
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
        {COPY.calendarPostModal.teamFeedback} ({comments.length})
      </div>

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
