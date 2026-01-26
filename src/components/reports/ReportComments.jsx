import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Trash2, Reply } from "lucide-react";
import { format } from 'date-fns';

export default function ReportComments({ report }) {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['report-comments', report?.id],
    queryFn: () => base44.entities.ReportComment.filter({ report_id: report.id }, '-created_date', 100),
    enabled: !!report?.id,
  });

  const { data: shares = [] } = useQuery({
    queryKey: ['report-shares', report?.id],
    queryFn: () => base44.entities.ReportShare.filter({ report_id: report.id, is_active: true }),
    enabled: !!report?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ReportComment.create(data);
      
      // Create notifications for mentioned users and report owner
      const notifyEmails = new Set([report.created_by, ...shares.map(s => s.shared_with_email)]);
      notifyEmails.delete(user.email); // Don't notify yourself
      
      for (const email of notifyEmails) {
        await base44.entities.Notification.create({
          user_email: email,
          type: 'report_comment',
          title: 'New Comment on Report',
          message: `${user.full_name} commented on "${report.name}"`,
          link: `/reports/${report.id}`,
          data: { report_id: report.id, comment: data.comment_text.substring(0, 100) }
        });
      }

      // Audit log
      await base44.entities.ReportAuditLog.create({
        report_id: report.id,
        action: 'comment_added',
        user_email: user.email,
        details: { timestamp: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-comments'] });
      setCommentText('');
      setReplyingTo(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => base44.entities.ReportComment.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-comments'] });
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    addCommentMutation.mutate({
      report_id: report.id,
      comment_text: commentText,
      author_email: user.email,
      author_name: user.full_name,
      parent_comment_id: replyingTo?.id || null
    });
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  const CommentItem = ({ comment, isReply }) => (
    <div className={`${isReply ? 'ml-12 mt-3' : ''}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-violet-600 dark:text-violet-300">
            {comment.author_name?.[0]?.toUpperCase() || comment.author_email?.[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.author_name || comment.author_email}
            </span>
            {comment.author_email === report.created_by && (
              <Badge variant="secondary" className="text-xs">Owner</Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(comment.created_date), 'MMM d, h:mm a')}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {comment.comment_text}
          </p>
          <div className="flex items-center gap-2">
            {!isReply && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setReplyingTo(comment)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
            {comment.author_email === user.email && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-600 hover:text-red-700"
                onClick={() => deleteCommentMutation.mutate(comment.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Replies */}
          {!isReply && getReplies(comment.id).map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Replying to {replyingTo.author_name}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button
              onClick={handleAddComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {comments.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}