import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Send, Edit2, Trash2, AtSign } from 'lucide-react';

export default function PostComments({ postId, post }) {
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const records = await base44.entities.PostComment.filter(
        { post_id: postId },
        '-created_date',
        100
      );
      return records;
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (text) =>
      base44.entities.PostComment.create({
        post_id: postId,
        text,
        author_email: currentUser?.email,
        author_name: currentUser?.full_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setComment('');
      // Create notification for post owner
      if (post?.created_by && post.created_by !== currentUser?.email) {
        base44.entities.Notification.create({
          recipient_email: post.created_by,
          type: 'post_comment',
          title: 'New comment on your post',
          message: `${currentUser?.full_name} commented on "${post.title || post.caption?.substring(0, 30)}"`,
          post_id: postId,
          read: false,
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text }) =>
      base44.entities.PostComment.update(id, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  const handleMention = (user) => {
    const beforeMention = comment.substring(0, comment.lastIndexOf('@'));
    setComment(`${beforeMention}@${user.full_name} `);
    setMentionOpen(false);
  };

  const highlightMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    return text.replace(mentionRegex, '<span class="text-blue-600 font-semibold">@$1</span>');
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Comments ({comments.length})</h3>

        {/* Comment Input */}
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setMentionOpen(e.target.value.includes('@'));
              }}
              placeholder="Add a comment... Type @ to mention someone"
              className="min-h-20 resize-none"
            />
            {mentionOpen && comment.includes('@') && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                {allUsers
                  .filter(u => u.full_name?.toLowerCase().includes(comment.split('@').pop().toLowerCase()))
                  .map(user => (
                    <button
                      key={user.email}
                      onClick={() => handleMention(user)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm"
                    >
                      {user.full_name}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => createMutation.mutate(comment)}
            disabled={!comment.trim() || createMutation.isPending}
            className="gap-2"
          >
            <Send className="w-3 h-3" /> Comment
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-50 dark:bg-slate-900/30 p-3 rounded-lg">
              <div className="flex items-start gap-3">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs">{c.author_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{c.author_name}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {editingId === c.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-16 resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: c.id, text: editText })}
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">{c.text}</p>
                  )}

                  {currentUser?.email === c.author_email && !editingId && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditText(c.text);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}