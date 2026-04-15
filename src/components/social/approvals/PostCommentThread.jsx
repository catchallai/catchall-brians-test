import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, AtSign, Loader2, MessageSquare, Reply, AlertTriangle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostStatus } from '@/types/enums';
import COPY from '@/lib/copy';

// Simple @mention detection: finds @word patterns
function parseMentions(text) {
  const parts = [];
  const regex = /@(\w+)/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', value: text.slice(lastIdx, match.index) });
    }
    parts.push({ type: 'mention', value: match[0] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIdx) });
  }
  return parts;
}

function CommentBubble({ comment, currentUser, onReply }) {
  const isMine = comment.by_email === currentUser?.email;
  const parts = parseMentions(comment.text || '');

  return (
    <div className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] bg-violet-100 text-violet-600">
          {comment.by_name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {comment.reply_to_name && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Reply className="w-3 h-3" />
            Replying to{' '}
            <span className="font-medium text-violet-500">@{comment.reply_to_name}</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isMine
              ? 'bg-violet-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
          }`}
        >
          {parts.map((p, i) =>
            p.type === 'mention' ? (
              <span
                key={i}
                className={`font-semibold ${isMine ? 'text-violet-200' : 'text-violet-600'}`}
              >
                {p.value}
              </span>
            ) : (
              <span key={i}>{p.value}</span>
            )
          )}
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-gray-400">
            {comment.by_name} ·{' '}
            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
          </span>
          {!isMine && (
            <button
              onClick={() => onReply(comment)}
              className="text-[10px] text-violet-500 hover:text-violet-700 font-medium"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   post: any,
 *   currentUser: any,
 *   pendingAction?: string | null,
 *   onPendingActionComplete?: () => void,
 *   onPendingActionCancel?: () => void,
 * }} props
 */
export default function PostCommentThread({
  post,
  currentUser,
  pendingAction = null,
  onPendingActionComplete,
  onPendingActionCancel,
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const comments = post.workflow_history?.filter((e) => e.action === 'comment') || [];

  const mutation = useMutation({
    mutationFn: ({ comment, workflowEvent, statusUpdate }) => {
      const history = [...(post.workflow_history || []), comment];
      if (workflowEvent) {
        history.push(workflowEvent);
      }
      return base44.entities.CalendarPost.update(post.id, {
        workflow_history: history,
        ...statusUpdate,
      });
    },
    onSuccess: (_, { statusUpdate }) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-post'] });
      setText('');
      setReplyTo(null);
      if (statusUpdate && onPendingActionComplete) {
        onPendingActionComplete();
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleInput = (e) => {
    const val = e.target.value;
    setText(val);
    // detect @mention
    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1 && atIdx === val.length - 1) {
      setShowMentions(true);
      setMentionQuery('');
    } else if (atIdx !== -1) {
      const afterAt = val.slice(atIdx + 1);
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(afterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user) => {
    const atIdx = text.lastIndexOf('@');
    const newText =
      text.slice(0, atIdx) + `@${user.full_name?.split(' ')[0] || user.email.split('@')[0]} `;
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredUsers = allUsers
    .filter(
      (u) =>
        u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(mentionQuery.toLowerCase())
    )
    .slice(0, 5);

  const handleSubmit = () => {
    if (!text.trim()) {
      return;
    }

    const comment = {
      action: 'comment',
      by_email: currentUser?.email,
      by_name: currentUser?.full_name || currentUser?.email,
      timestamp: new Date().toISOString(),
      text: text.trim(),
      reply_to_name: replyTo?.by_name,
      reply_to_id: replyTo?.timestamp,
    };

    let workflowEvent = null;
    let statusUpdate = null;

    if (pendingAction) {
      workflowEvent = {
        action: pendingAction,
        by_email: currentUser?.email,
        by_name: currentUser?.full_name || currentUser?.email,
        timestamp: new Date().toISOString(),
      };
      statusUpdate =
        pendingAction === PostStatus.REJECTED
          ? { status: PostStatus.REJECTED, rejected_reason: text.trim(), media_approved: false }
          : { status: PostStatus.CHANGES_REQUESTED };
    }

    mutation.mutate({ comment, workflowEvent, statusUpdate });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Comments</h3>
        <Badge variant="outline" className="text-xs">
          {comments.length}
        </Badge>
      </div>

      {/* Pending action banner */}
      {pendingAction && (
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2 mb-3 text-xs ${
            pendingAction === PostStatus.REJECTED
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-orange-50 border border-orange-200 text-orange-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {pendingAction === PostStatus.REJECTED ? (
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="font-medium">
              {pendingAction === PostStatus.REJECTED
                ? COPY.postCommentThread.rejectionBanner
                : COPY.postCommentThread.changesBanner}
            </span>
          </div>
          <button
            onClick={onPendingActionCancel}
            className="text-gray-400 hover:text-gray-600 font-medium ml-2"
          >
            {COPY.general.cancel}
          </button>
        </div>
      )}

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 max-h-64 pr-1">
        {comments.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No comments yet. Start the conversation!
          </div>
        )}
        {comments.map((c, i) => (
          <CommentBubble key={i} comment={c} currentUser={currentUser} onReply={setReplyTo} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 rounded-lg px-3 py-1.5 mt-2 text-xs">
          <span className="text-violet-700">
            Replying to <strong>{replyTo.by_name}</strong>
          </span>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500">
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="relative mt-3">
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 overflow-hidden">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => insertMention(u)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-left text-sm"
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-violet-100 text-violet-600">
                    {u.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment… use @ to mention someone"
              rows={2}
              className="w-full resize-none text-sm px-3 py-2 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
            />
            <AtSign className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-300" />
          </div>
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!text.trim() || mutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 rounded-xl h-10 w-10 shrink-0"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
