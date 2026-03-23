import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function CommentsPanel({ pageId, spaceId, user }) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['wiki-comments', pageId],
    queryFn: () => base44.entities.WikiPageComment.filter({ page_id: pageId }),
    enabled: !!pageId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!pageId) {
      return;
    }

    const unsubscribe = base44.entities.WikiPageComment.subscribe((event) => {
      if (event.data?.page_id === pageId) {
        queryClient.invalidateQueries({ queryKey: ['wiki-comments', pageId] });
      }
    });

    return unsubscribe;
  }, [pageId, queryClient]);

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.WikiPageComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-comments'] });
      setNewComment('');
      setReplyTo(null);
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: ({ id, resolved }) => base44.entities.WikiPageComment.update(id, { resolved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-comments'] });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) {
      return;
    }

    createCommentMutation.mutate({
      page_id: pageId,
      space_id: spaceId,
      content: newComment,
      author_email: user.email,
      author_name: user.full_name,
      parent_comment_id: replyTo?.id || null,
    });
  };

  const rootComments = comments.filter((c) => !c.parent_comment_id && !c.resolved);
  const resolvedComments = comments.filter((c) => !c.parent_comment_id && c.resolved);

  const getReplies = (commentId) => {
    return comments.filter((c) => c.parent_comment_id === commentId);
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
              {comment.author_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.author_name}
              </span>
              <span className="text-xs text-gray-400">
                {format(new Date(comment.created_date), 'MMM d, h:mm a')}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setReplyTo(comment)}
              >
                Reply
              </Button>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => resolveCommentMutation.mutate({ id: comment.id, resolved: true })}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )}
            </div>
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {rootComments.length === 0 && resolvedComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No comments yet</p>
          </div>
        ) : (
          <div>
            {rootComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}

            {resolvedComments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">
                    Resolved ({resolvedComments.length})
                  </span>
                </div>
                {resolvedComments.map((comment) => (
                  <div key={comment.id} className="opacity-60">
                    <CommentItem comment={comment} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {replyTo && (
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs flex items-center justify-between">
            <span className="text-gray-600">Replying to {replyTo.author_name}</span>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Cmd/Ctrl + Enter to send</p>
      </div>
    </div>
  );
}
