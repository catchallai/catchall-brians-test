import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, AtSign, Loader2, MessageSquare, Reply } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CommentActionType } from '@/types/enums';
import { versionAt } from '@/utils/versionAt';
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

const ACTION_TYPE_STYLES = {
  [CommentActionType.REJECTED]: {
    badge: COPY.approvalActionDrawer.badge.rejection,
    badgeClass:
      'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  },
  [CommentActionType.APPROVED]: {
    badge: COPY.approvalActionDrawer.badge.approval,
    badgeClass:
      'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  },
  [CommentActionType.CHANGES_REQUESTED]: {
    badge: COPY.approvalActionDrawer.badge.request_changes,
    badgeClass:
      'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  },
};

/**
 * @param {{
 *   comment: any,
 *   currentUser: any,
 *   onReply: (comment: any) => void,
 *   derivedActionType?: any,
 *   isUnread?: boolean,
 *   version: number,
 * }} props
 */
function CommentCard({ comment, currentUser, onReply, derivedActionType, isUnread, version }) {
  const parts = parseMentions(comment.text || '');
  const actionStyle = derivedActionType ? ACTION_TYPE_STYLES[derivedActionType] : null;
  const isReply = !!comment.reply_to_name;
  const isMine = comment.by_email === currentUser?.email;
  const displayName = isMine ? 'You' : comment.by_name || comment.by_email;
  const fullTimestamp = format(new Date(comment.timestamp), "MMM d, yyyy 'at' h:mm a");

  return (
    <div
      className={`flex gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 ${
        isReply ? 'ml-10' : ''
      }`}
    >
      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {comment.by_name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        {/* Header: unread dot, name, action badge, timestamp, reply */}
        <div className="flex items-center gap-2 flex-wrap">
          {isUnread && (
            <span
              className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
              role="img"
              aria-label="Unread"
            />
          )}
          <span className="text-xs font-semibold text-gray-900 dark:text-white">{displayName}</span>
          {actionStyle && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${actionStyle.badgeClass}`}
            >
              {actionStyle.badge}
            </span>
          )}
          <span className="text-[10px] text-gray-400 cursor-default" title={fullTimestamp}>
            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
          </span>
          <span className="text-[10px] text-gray-400">
            {COPY.postVersion.versionLabel(version)}
          </span>
          {comment.by_email !== currentUser?.email && (
            <button
              onClick={() => onReply(comment)}
              className="text-[10px] text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 font-medium ml-auto"
            >
              Reply
            </button>
          )}
        </div>

        {/* Reply context */}
        {isReply && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
            <Reply className="w-3 h-3" />
            <span className="font-medium text-violet-500">@{comment.reply_to_name}</span>
          </div>
        )}

        {/* Body */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
          {parts.map((p, i) =>
            p.type === 'mention' ? (
              <span key={i} className="font-semibold text-violet-600 dark:text-violet-400">
                {p.value}
              </span>
            ) : (
              <span key={i}>{p.value}</span>
            )
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   post: any,
 *   currentUser: any,
 *   onPostUpdated?: (updatedPost: any) => void,
 * }} props
 */
export default function PostCommentThread({ post, currentUser, onPostUpdated }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIdx, setMentionIdx] = useState(0);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Build comments list with derived action types.
  // When a comment is immediately followed by a reject/approve/changes_requested
  // event from the same user, that comment is associated with that action.
  const { comments, commentActionMap } = useMemo(() => {
    const history = post.workflow_history || [];
    const actionMap = new Map();
    const ACTION_ACTIONS = new Set([
      CommentActionType.REJECTED,
      CommentActionType.APPROVED,
      CommentActionType.CHANGES_REQUESTED,
    ]);

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      if (entry.action !== 'comment') continue;

      // Check if the entry already has an action_type field
      if (entry.action_type && ACTION_ACTIONS.has(entry.action_type)) {
        actionMap.set(entry.timestamp, entry.action_type);
        continue;
      }

      // Look at the next entry — if it's an action from the same user, link them
      const next = history[i + 1];
      if (next && ACTION_ACTIONS.has(next.action) && next.by_email === entry.by_email) {
        actionMap.set(entry.timestamp, next.action);
      }
    }

    return {
      comments: history.filter((e) => e.action === 'comment'),
      commentActionMap: actionMap,
    };
  }, [post.workflow_history]);

  // Find the current user's last "viewed" event timestamp for unread detection
  const lastViewedAt = useMemo(() => {
    const history = post.workflow_history || [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].action === 'viewed' && history[i].by_email === currentUser?.email) {
        return history[i].timestamp;
      }
    }
    return null;
  }, [post.workflow_history, currentUser?.email]);

  const mutation = useMutation({
    mutationFn: (comment) => {
      const history = [...(post.workflow_history || []), comment];
      return base44.entities.CalendarPost.update(post.id, { workflow_history: history });
    },
    onSuccess: (updatedPost) => {
      if (!updatedPost) {
        // Still clear UI state even if the server didn't echo the post back,
        // so the user isn't left staring at their own draft text.
        setText('');
        setReplyTo(null);
        // Invalidate the detail query so PostApprovalView (and any other
        // subscriber keyed on this post's id) refetches the updated
        // workflow_history even when the server returned no body.
        queryClient.invalidateQueries({ queryKey: ['calendar-post', post.id] });
        queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
        return;
      }
      // Key the cache by the id echoed from the server, not the closure's
      // post.id — the component may have re-rendered with a different post
      // while the mutation was in flight.
      queryClient.setQueryData(['calendar-post', updatedPost.id ?? post.id], updatedPost);
      // Notify callers that pass `post` from non-query state (e.g. the
      // PostComposer modal, where `post` comes from local `savedPost` state
      // that isn't subscribed to the react-query cache).
      onPostUpdated?.(updatedPost);
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setText('');
      setReplyTo(null);
    },
  });

  // Record a "viewed" event once when the Comments tab mounts (per post).
  // Fetches the latest post first to avoid overwriting concurrent changes
  // (last-write-wins race on workflow_history).
  const hasRecordedView = useRef(null);
  useEffect(() => {
    if (!currentUser?.email || comments.length === 0) return;
    if (hasRecordedView.current === post.id) return;
    hasRecordedView.current = post.id;

    base44.entities.CalendarPost.get(post.id)
      .then((latest) => {
        const history = [
          ...(latest.workflow_history || []),
          {
            action: 'viewed',
            by_email: currentUser.email,
            by_name: currentUser.full_name || currentUser.email,
            timestamp: new Date().toISOString(),
          },
        ];
        return base44.entities.CalendarPost.update(post.id, { workflow_history: history });
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar-post'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      })
      .catch(() => {
        // Reset so the next mount can retry
        hasRecordedView.current = null;
      });
  }, [post.id, currentUser, comments.length, queryClient]);

  // Auto-focus the textarea when the Comments tab mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  // Auto-resize textarea: grows from 2 rows up to 6 rows
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 20; // ~text-sm line height
    const maxHeight = lineHeight * 6 + 16; // 6 rows + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setText(val);
    autoResize();
    // detect @mention
    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1 && atIdx === val.length - 1) {
      setShowMentions(true);
      setMentionQuery('');
      setMentionIdx(0);
    } else if (atIdx !== -1) {
      const afterAt = val.slice(atIdx + 1);
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(afterAt);
        setMentionIdx(0);
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
    if (!text.trim() || !currentUser?.email) return;

    const comment = {
      action: 'comment',
      action_type: CommentActionType.GENERAL,
      by_email: currentUser?.email,
      by_name: currentUser?.full_name || currentUser?.email,
      timestamp: new Date().toISOString(),
      text: text.trim(),
      reply_to_name: replyTo?.by_name,
      reply_to_id: replyTo?.timestamp,
    };

    mutation.mutate(comment);
    // Reset textarea height after submit
    if (inputRef.current) inputRef.current.style.height = 'auto';
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

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-64 pr-1 divide-y divide-gray-100 dark:divide-gray-800">
        {comments.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {COPY.postCommentThread.emptyTitle}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {COPY.postCommentThread.emptySubtitle}
            </p>
          </div>
        )}
        {comments.map((c, i) => (
          <CommentCard
            key={i}
            comment={c}
            currentUser={currentUser}
            onReply={setReplyTo}
            derivedActionType={commentActionMap.get(c.timestamp)}
            isUnread={!!(lastViewedAt && c.timestamp > lastViewedAt)}
            version={versionAt(post.workflow_history, c.timestamp)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 mt-2 text-xs">
          <span className="text-gray-600 dark:text-gray-300">
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
            {filteredUsers.map((u, idx) => (
              <button
                key={u.id}
                onClick={() => insertMention(u)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${
                  idx === mentionIdx
                    ? 'bg-violet-50 dark:bg-violet-900/30'
                    : 'hover:bg-violet-50 dark:hover:bg-violet-900/30'
                }`}
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
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (showMentions && filteredUsers.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIdx((prev) => (prev + 1) % filteredUsers.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIdx(
                      (prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length
                    );
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    insertMention(filteredUsers[mentionIdx]);
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowMentions(false);
                    return;
                  }
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={COPY.postCommentThread.inputPlaceholder}
              rows={2}
              className="w-full resize-none text-sm px-3 py-2 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
              style={{ overflow: 'hidden' }}
            />
            <button
              type="button"
              onClick={() => {
                const el = inputRef.current;
                if (!el) return;
                // Insert @ at cursor position and trigger mention dropdown
                const pos = el.selectionStart || text.length;
                const newText = text.slice(0, pos) + '@' + text.slice(pos);
                setText(newText);
                setShowMentions(true);
                setMentionQuery('');
                el.focus();
                // Set cursor after the @
                requestAnimationFrame(() => el.setSelectionRange(pos + 1, pos + 1));
              }}
              className="absolute right-2 bottom-2.5 text-gray-300 hover:text-violet-500 transition-colors"
              aria-label="Mention someone"
            >
              <AtSign className="w-4 h-4" />
            </button>
          </div>
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!text.trim() || !currentUser?.email || mutation.isPending}
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
