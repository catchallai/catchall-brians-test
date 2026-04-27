import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, X } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { PlatformBadges } from '@/components/ui/PlatformBadges';
import PostStatusChip from '@/components/social/PostStatusChip';
import { toast } from 'sonner';
import { todayLocal, isScheduledInFuture } from '@/utils/date';
import COPY from '@/lib/copy';
import { PostStatus } from '@/types/enums';
import { getPostStatusStyles } from '@/lib/postStatusConfig';
import { computePurgeAt } from '@/utils/deletedPostTimer';
import { getPostCardLabel } from '@/utils/getPostCardLabel';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  buildDeletePostDescription,
  getDeletePostTitle,
  hasBeenPublished,
} from '@/components/social/deleted-posts/deletePostDescription';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h) {
  if (h === 0) {
    return '12 AM';
  }
  if (h === 12) {
    return '12 PM';
  }
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

/** Formats "14:30" → "2:30 PM", "09:00" → "9:00 AM" */
function formatTime(time) {
  const match = time?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const h = parseInt(match[1]);
  const m = match[2];
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m} ${suffix}`;
}

function getPostHour(post) {
  if (!post.scheduled_time) {
    return null;
  }
  const match = post.scheduled_time.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

// Overnight hours to collapse by default (#6)
const OVERNIGHT_HOURS = [1, 2, 3, 4, 5];

/**
 * Lightweight dialog listing all posts for a given day, grouped by time.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   posts: Array<{ id: string, title?: string, caption?: string, status: import('@/types/enums').PostStatus, scheduled_time?: string, platforms?: string[] }>,
 *   date: Date | null,
 *   onEditPost: (post: any) => void,
 * }} props
 */
function DayPostsDialog({ open, onClose, posts, date, onEditPost }) {
  // Group posts by hour, with untimed posts first
  const grouped = [];
  const untimed = posts.filter((p) => getPostHour(p) === null);
  if (untimed.length > 0) {
    grouped.push({ label: 'All Day', posts: untimed });
  }
  const byHour = {};
  posts.forEach((p) => {
    const h = getPostHour(p);
    if (h !== null) {
      if (!byHour[h]) byHour[h] = [];
      byHour[h].push(p);
    }
  });
  Object.keys(byHour)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((h) => {
      grouped.push({ label: formatHour(Number(h)), posts: byHour[h] });
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" windowControls={false}>
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {date ? format(date, 'EEEE, MMMM d, yyyy') : ''}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {grouped.map((group) => (
            <div key={group.label} className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {group.label}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => {
                      onClose();
                      onEditPost(post);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <PlatformBadges platforms={post.platforms ?? []} size="sm" />
                    <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {getPostCardLabel(post, { maxLen: 40 })}
                    </span>
                    {post.scheduled_time && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(post.scheduled_time)}
                      </span>
                    )}
                    <PostStatusChip status={post.status} iconOnly />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DayView({
  day,
  posts,
  onAddPost,
  onEditPost,
  onRequestDelete,
  updatePostMutation,
  draggedPost,
  setDraggedPost,
}) {
  const isToday = isSameDay(day, new Date());
  const isPastDay = format(day, 'yyyy-MM-dd') < todayLocal();
  const now = new Date();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const scrollRef = useRef(null);
  const [showOvernight, setShowOvernight] = useState(false);
  const [draggingOver, setDraggingOver] = useState(null);

  // #1 Auto-scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current && isToday) {
      const targetHour = Math.max(nowHour - 1, 0);
      const hourEl = scrollRef.current.querySelector(`[data-hour="${targetHour}"]`);
      if (hourEl) {
        hourEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [isToday, day]);

  // Group posts by hour
  const postsByHour = {};
  const untimedPosts = [];
  posts.forEach((post) => {
    const h = getPostHour(post);
    if (h !== null) {
      if (!postsByHour[h]) {
        postsByHour[h] = [];
      }
      postsByHour[h].push(post);
    } else {
      untimedPosts.push(post);
    }
  });

  const handleHourClick = (hour) => {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    onAddPost && onAddPost({ scheduled_date: format(day, 'yyyy-MM-dd'), scheduled_time: timeStr });
  };

  // #5 Drag-to-reschedule within day view
  const isHourPast = (hour) => {
    if (isPastDay) return true;
    if (isToday && hour <= nowHour) return true;
    return false;
  };

  const handleHourDragOver = (e, hour) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isHourPast(hour) ? 'none' : 'move';
    setDraggingOver(hour);
  };

  const handleHourDrop = (e, hour) => {
    e.preventDefault();
    setDraggingOver(null);
    if (!draggedPost) return;
    if (isHourPast(hour)) {
      setDraggedPost(null);
      return;
    }
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    const destDate = draggedPost.scheduled_date || todayLocal();
    updatePostMutation.mutate({
      id: draggedPost.id,
      data: {
        scheduled_time: timeStr,
        // Rescheduling an expired post brings it back into the workflow as a draft.
        ...(draggedPost.status === PostStatus.UNUSED &&
          isScheduledInFuture(destDate, timeStr, draggedPost.timezone) && {
            status: PostStatus.DRAFT,
          }),
      },
    });
    setDraggedPost(null);
  };

  const visibleOvernightCount = OVERNIGHT_HOURS.reduce(
    (acc, h) => acc + (postsByHour[h]?.length || 0),
    0
  );

  // #2 Current time indicator position (% within the hour slot)
  const nowMinutePct = (nowMinute / 60) * 100;

  return (
    <div className="overflow-y-auto max-h-[700px]" ref={scrollRef}>
      {/* #7 Post count badge in header area */}
      {posts.length > 0 && (
        <div className="px-4 py-2 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800 flex items-center gap-2">
          <Badge className="bg-violet-600 text-white text-xs">
            {posts.length} post{posts.length !== 1 ? 's' : ''} today
          </Badge>
          <span className="text-xs text-violet-600 dark:text-violet-400">
            {Object.keys(postsByHour).length} time slot
            {Object.keys(postsByHour).length !== 1 ? 's' : ''} scheduled
          </span>
        </div>
      )}

      {/* All-day / untimed posts */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 min-h-[40px]">
        <div className="w-20 flex-shrink-0 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 font-medium border-r border-gray-200 dark:border-gray-600">
          all-day
        </div>
        <div className="flex-1 px-3 py-2 flex flex-wrap gap-2">
          {untimedPosts.map((post) => {
            const styles = getPostStatusStyles(post.status);
            const canDrag = post.status !== PostStatus.PUBLISHED;
            return (
              <div
                key={post.id}
                draggable={canDrag}
                onDragStart={(e) => {
                  if (!canDrag) {
                    e.preventDefault();
                    return;
                  }
                  setDraggedPost(post);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDraggedPost(null)}
                onClick={() => onEditPost(post)}
                className={`text-xs px-2 py-1 rounded-md border border-l-4 ${styles.leftBorderClass} flex items-center gap-1.5 group/post ${canDrag ? 'cursor-move' : 'cursor-pointer'} ${styles.bgClass} ${styles.borderClass} ${draggedPost?.id === post.id ? 'opacity-50' : ''}`}
              >
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {getPostCardLabel(post, { maxLen: 20 })}
                </span>
                <PostStatusChip status={post.status} />
              </div>
            );
          })}
        </div>
      </div>

      {/* #6 Overnight collapse toggle */}
      {!showOvernight && (
        <button
          onClick={() => setShowOvernight(true)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-300 dark:border-gray-700 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
          <span>
            Show overnight hours (1 AM – 5 AM)
            {visibleOvernightCount > 0
              ? ` · ${visibleOvernightCount} post${visibleOvernightCount !== 1 ? 's' : ''}`
              : ''}
          </span>
        </button>
      )}

      {/* Hourly rows */}
      {HOURS.map((hour) => {
        // #6 Skip overnight hours if collapsed
        if (!showOvernight && OVERNIGHT_HOURS.includes(hour)) {
          return null;
        }

        const hourPosts = postsByHour[hour] || [];
        const isCurrentHour = isToday && hour === nowHour;
        const isDragTarget = draggingOver === hour;
        const hourIsPast = isHourPast(hour);
        const isDragOverValid = isDragTarget && !hourIsPast;
        const isDragOverPast = isDragTarget && hourIsPast;

        return (
          <div
            key={hour}
            data-hour={hour}
            className={`flex border-b border-gray-300 dark:border-gray-700 min-h-[80px] group/hour relative cursor-pointer transition-colors ${
              isDragOverValid
                ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-inset ring-violet-400'
                : isDragOverPast
                  ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-inset ring-red-300 cursor-not-allowed'
                  : isCurrentHour
                    ? 'bg-violet-50 dark:bg-violet-900/20'
                    : 'bg-white dark:bg-gray-800 hover:bg-violet-50/30 dark:hover:bg-violet-900/10'
            }`}
            onClick={() => handleHourClick(hour)}
            onDragOver={(e) => handleHourDragOver(e, hour)}
            onDragLeave={() => setDraggingOver(null)}
            onDrop={(e) => handleHourDrop(e, hour)}
          >
            <div
              className={`w-20 flex-shrink-0 px-3 pt-3 text-xs font-medium border-r border-gray-300 dark:border-gray-700 ${isCurrentHour ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {formatHour(hour)}
            </div>

            <div
              className="flex-1 px-3 py-2 flex flex-col gap-1.5 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* #2 Current time indicator red line */}
              {isCurrentHour && (
                <div
                  className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                  style={{ top: `${nowMinutePct}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}

              {hourPosts.map((post) => {
                const styles = getPostStatusStyles(post.status);
                const canDrag = post.status !== PostStatus.PUBLISHED;
                return (
                  <div
                    key={post.id}
                    draggable={canDrag}
                    onDragStart={(e) => {
                      if (!canDrag) {
                        e.preventDefault();
                        return;
                      }
                      setDraggedPost(post);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedPost(null)}
                    className={`text-sm p-2 pl-3 rounded-lg border border-l-4 ${styles.leftBorderClass} transition-all hover:shadow-md group/post ${canDrag ? 'cursor-move' : 'cursor-pointer'} ${styles.bgClass} ${styles.borderClass} ${draggedPost?.id === post.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex items-center gap-2 min-w-0 flex-1"
                        onClick={() => onEditPost(post)}
                      >
                        <PlatformBadges platforms={post.platforms ?? []} size="lg" />
                        <span className="truncate text-gray-800 dark:text-gray-200 font-semibold">
                          {getPostCardLabel(post, { maxLen: 40 })}
                        </span>
                        {post.scheduled_time && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {post.scheduled_time}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <PostStatusChip status={post.status} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(post);
                          }}
                          className="opacity-0 group-hover/post:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hourPosts.length === 0 && (
                <div className="opacity-0 group-hover/hour:opacity-100 transition-opacity mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHourClick(hour);
                    }}
                    className="text-xs text-violet-500 dark:text-violet-400 flex items-center gap-1 hover:text-violet-700"
                  >
                    <Plus className="w-3 h-3" /> Add post at {formatHour(hour)}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Collapse overnight button when expanded */}
      {showOvernight && (
        <button
          onClick={() => setShowOvernight(false)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-300 dark:border-gray-700 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          <span>Hide overnight hours</span>
        </button>
      )}
    </div>
  );
}

function WeekView({
  days,
  getPostsForDay,
  onAddPost,
  onEditPost,
  updatePostMutation,
  draggedPost,
  setDraggedPost,
  showPopover,
  hidePopover,
  onShowDayPosts,
}) {
  const scrollRef = useRef(null);
  const [showOvernight, setShowOvernight] = useState(false);
  const [draggingOver, setDraggingOver] = useState(null); // { hour, dayIdx }
  const now = new Date();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowMinutePct = (nowMinute / 60) * 100;

  useEffect(() => {
    if (scrollRef.current) {
      const targetHour = Math.max(nowHour - 1, 0);
      const hourEl = scrollRef.current.querySelector(`[data-week-hour="${targetHour}"]`);
      if (hourEl) {
        hourEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, []);

  const handleCellClick = (day, hour) => {
    onAddPost &&
      onAddPost({
        scheduled_date: format(day, 'yyyy-MM-dd'),
        scheduled_time: `${String(hour).padStart(2, '0')}:00`,
      });
  };

  const handleDrop = (e, day, hour) => {
    e.preventDefault();
    setDraggingOver(null);
    if (!draggedPost) return;
    const newDate = format(day, 'yyyy-MM-dd');
    const today = todayLocal();
    const isPast = newDate < today || (newDate === today && hour <= nowHour);
    if (isPast) {
      setDraggedPost(null);
      return;
    }
    updatePostMutation.mutate({
      id: draggedPost.id,
      data: {
        scheduled_date: newDate,
        scheduled_time: `${String(hour).padStart(2, '0')}:00`,
        // Rescheduling an expired post brings it back into the workflow as a draft.
        ...(draggedPost.status === PostStatus.UNUSED &&
          isScheduledInFuture(
            newDate,
            `${String(hour).padStart(2, '0')}:00`,
            draggedPost.timezone
          ) && {
            status: PostStatus.DRAFT,
          }),
      },
    });
    setDraggedPost(null);
  };

  const visibleOvernightCount = days.reduce((total, day) => {
    const dayPosts = getPostsForDay(day);
    return (
      total +
      dayPosts.filter((p) => {
        const h = getPostHour(p);
        return h !== null && OVERNIGHT_HOURS.includes(h);
      }).length
    );
  }, 0);

  return (
    <div className="overflow-y-auto max-h-[700px]" ref={scrollRef}>
      {/* Sticky day column headers */}
      <div className="flex sticky top-0 z-20 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-600">
        <div className="w-16 flex-shrink-0" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={i}
              className={`flex-1 text-center py-2 border-l border-gray-300 dark:border-gray-700 ${isToday ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-violet-600 text-white' : 'text-gray-800 dark:text-gray-100'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 min-h-[36px]">
        <div className="w-16 flex-shrink-0 px-2 py-2 text-xs text-gray-400 font-medium border-r border-gray-200 dark:border-gray-600">
          all-day
        </div>
        {days.map((day, i) => {
          const untimedPosts = getPostsForDay(day).filter((p) => getPostHour(p) === null);
          return (
            <div
              key={i}
              className="flex-1 border-l border-gray-300 dark:border-gray-700 px-1 py-1 flex flex-wrap gap-1"
            >
              {untimedPosts.map((post) => {
                const styles = getPostStatusStyles(post.status);
                return (
                  <div
                    key={post.id}
                    draggable={post.status !== PostStatus.PUBLISHED}
                    onDragStart={(e) => {
                      setDraggedPost(post);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedPost(null)}
                    onMouseEnter={(e) => showPopover(post, e)}
                    onMouseLeave={hidePopover}
                    onClick={() => onEditPost(post)}
                    className={`text-xs px-1.5 py-0.5 rounded border truncate max-w-full ${post.status === PostStatus.PUBLISHED ? 'cursor-pointer' : 'cursor-move'} ${styles.bgClass} ${styles.borderClass}`}
                  >
                    {getPostCardLabel(post, { maxLen: 20 })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Overnight collapse */}
      {!showOvernight && (
        <button
          onClick={() => setShowOvernight(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-300 dark:border-gray-700 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
          Show overnight (1–5 AM)
          {visibleOvernightCount > 0
            ? ` · ${visibleOvernightCount} post${visibleOvernightCount !== 1 ? 's' : ''}`
            : ''}
        </button>
      )}

      {/* Hourly grid */}
      {HOURS.map((hour) => {
        if (!showOvernight && OVERNIGHT_HOURS.includes(hour)) {
          return null;
        }
        const isCurrentHour = hour === nowHour;

        return (
          <div
            key={hour}
            data-week-hour={hour}
            className="flex border-b border-gray-300 dark:border-gray-700 min-h-[64px] relative"
          >
            {/* Hour label */}
            <div
              className={`w-16 flex-shrink-0 px-2 pt-1.5 text-xs font-medium border-r border-gray-300 dark:border-gray-700 flex-none ${
                isCurrentHour
                  ? 'text-violet-600 dark:text-violet-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {formatHour(hour)}
            </div>

            {/* Day columns */}
            {days.map((day, dayIdx) => {
              const isDayToday = isSameDay(day, new Date());
              const dayHourPosts = getPostsForDay(day).filter((p) => getPostHour(p) === hour);
              const isDragTarget = draggingOver?.hour === hour && draggingOver?.dayIdx === dayIdx;
              const isPastDay = format(day, 'yyyy-MM-dd') < todayLocal();
              const isCellPast = isPastDay || (isDayToday && hour <= nowHour);
              const isDragOverValid = isDragTarget && !isCellPast;
              const isDragOverPast = isDragTarget && isCellPast;
              const showTimeLine = isDayToday && isCurrentHour;

              return (
                <div
                  key={dayIdx}
                  className={`flex-1 border-l border-gray-300 dark:border-gray-700 px-1 py-1 relative cursor-pointer group/cell transition-colors ${
                    isDragOverValid
                      ? 'bg-violet-100 dark:bg-violet-900/40 ring-1 ring-inset ring-violet-400'
                      : isDragOverPast
                        ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-inset ring-red-300 cursor-not-allowed'
                        : isDayToday
                          ? 'bg-violet-50/40 dark:bg-violet-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                  onClick={() => handleCellClick(day, hour)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = isCellPast ? 'none' : 'move';
                    setDraggingOver({ hour, dayIdx });
                  }}
                  onDragLeave={() => setDraggingOver(null)}
                  onDrop={(e) => handleDrop(e, day, hour)}
                >
                  {/* Current time red line — only in today's column */}
                  {showTimeLine && (
                    <div
                      className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                      style={{ top: `${nowMinutePct}%` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                      <div className="flex-1 h-px bg-red-500" />
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {dayHourPosts.slice(0, 2).map((post) => {
                      const styles = getPostStatusStyles(post.status);
                      const canDrag = post.status !== PostStatus.PUBLISHED;
                      return (
                        <div
                          key={post.id}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) {
                              e.preventDefault();
                              return;
                            }
                            setDraggedPost(post);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedPost(null);
                            setDraggingOver(null);
                          }}
                          onMouseEnter={(e) => showPopover(post, e)}
                          onMouseLeave={hidePopover}
                          onClick={() => onEditPost(post)}
                          className={`text-xs px-1.5 py-1 rounded border-l-2 ${styles.leftBorderClass} ${canDrag ? 'cursor-move' : 'cursor-pointer'} ${styles.bgClass} ${styles.borderClass} ${draggedPost?.id === post.id ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <span className="truncate flex-1">
                              {getPostCardLabel(post, { maxLen: 20 })}
                            </span>
                            <PlatformBadges
                              platforms={post.platforms ?? []}
                              size="sm"
                              maxVisible={3}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {dayHourPosts.length > 2 && (
                      <button
                        onClick={() => onShowDayPosts(day)}
                        className="text-xs text-violet-600 hover:underline text-left"
                      >
                        +{dayHourPosts.length - 2} more
                      </button>
                    )}
                    {dayHourPosts.length === 0 && (
                      <div className="opacity-0 group-hover/cell:opacity-100 transition-opacity">
                        <span className="text-xs text-violet-400 flex items-center gap-0.5">
                          <Plus className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {showOvernight && (
        <button
          onClick={() => setShowOvernight(false)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-300 dark:border-gray-700 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Hide overnight hours
        </button>
      )}
    </div>
  );
}

export default function SocialCalendarView({
  posts = [],
  onAddPost,
  onEditPost,
  currentMonth,
  onMonthChange,
  onViewTypeChange,
  viewType = 'month',
  currentUser,
}) {
  const [draggedPost, setDraggedPost] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(/** @type {string | null} */ (null));
  const [dayPostsModal, setDayPostsModal] = useState(
    /** @type {{ date: Date, posts: any[] } | null} */ (null)
  );
  const [hoveredPost, setHoveredPost] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0, above: false });
  const popoverTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-posts'] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: (post) => {
      const now = new Date();
      return base44.entities.CalendarPost.update(post.id, {
        status: PostStatus.DELETED,
        deleted_at: now.toISOString(),
        deleted_by: currentUser?.email || '',
        deleted_by_name: currentUser?.full_name || currentUser?.email || '',
        purge_at: computePurgeAt(now).toISOString(),
        workflow_history: [
          ...(post.workflow_history || []),
          {
            action: 'deleted',
            by_email: currentUser?.email,
            by_name: currentUser?.full_name || currentUser?.email,
            timestamp: now.toISOString(),
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      sonnerToast.success(COPY.deletedPosts.toasts.softDeleted);
    },
    onError: () => {
      sonnerToast.error(COPY.deletedPosts.toasts.softDeleteFailed);
    },
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deletePostMutation.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  };

  // Keyboard shortcuts: ←/→ to navigate, T = today, D/W/M = switch view
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (viewType === 'day') {
          onMonthChange(addDays(currentMonth, -1));
        } else if (viewType === 'week') {
          onMonthChange(addDays(currentMonth, -7));
        } else {
          onMonthChange(subMonths(currentMonth, 1));
        }
      } else if (e.key === 'ArrowRight') {
        if (viewType === 'day') {
          onMonthChange(addDays(currentMonth, 1));
        } else if (viewType === 'week') {
          onMonthChange(addDays(currentMonth, 7));
        } else {
          onMonthChange(addMonths(currentMonth, 1));
        }
      } else if (e.key === 't' || e.key === 'T') {
        onMonthChange(new Date());
      } else if (e.key === 'd' || e.key === 'D') {
        onViewTypeChange?.('day');
      } else if (e.key === 'w' || e.key === 'W') {
        onViewTypeChange?.('week');
      } else if (e.key === 'm' || e.key === 'M') {
        onViewTypeChange?.('month');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewType, currentMonth, onMonthChange, onViewTypeChange]);

  // Popover helpers
  const showPopover = (post, e) => {
    clearTimeout(popoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const above = rect.top > 300;
    setPopoverPos({ x: rect.left, y: above ? rect.top : rect.bottom, above });
    setHoveredPost(post);
  };
  const hidePopover = () => {
    popoverTimeoutRef.current = setTimeout(() => setHoveredPost(null), 150);
  };
  const keepPopover = () => clearTimeout(popoverTimeoutRef.current);

  let days;
  if (viewType === 'day') {
    days = [currentMonth];
  } else if (viewType === 'week') {
    const weekStart = startOfWeek(currentMonth);
    const weekEnd = endOfWeek(currentMonth);
    days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  } else {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }

  const getPostsForDay = (day) => {
    return posts.filter((post) => {
      if (!post.scheduled_date) {
        return false;
      }
      return isSameDay(parseISO(post.scheduled_date), day);
    });
  };

  const handleDragStart = (e, post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  /** Check if dropping the currently dragged post on `day` would schedule it
   *  in the past. The month view only changes the date (time is preserved),
   *  so we only enforce day-level validation — today is always allowed.
   *  Hour-level checks belong in the week/day views where the user
   *  explicitly picks a time slot. */
  const isDropInPast = (day) => {
    return format(day, 'yyyy-MM-dd') < todayLocal();
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    if (day) {
      e.dataTransfer.dropEffect = isDropInPast(day) ? 'none' : 'move';
      const dateStr = format(day, 'yyyy-MM-dd');
      if (dragOverDate !== dateStr) setDragOverDate(dateStr);
    }
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggedPost) return;
    if (isDropInPast(targetDate)) {
      setDraggedPost(null);
      return;
    }
    const newDate = format(targetDate, 'yyyy-MM-dd');
    const isDestInFuture = isScheduledInFuture(
      newDate,
      draggedPost.scheduled_time,
      draggedPost.timezone
    );
    const postHour = getPostHour(draggedPost);
    updatePostMutation.mutate({
      id: draggedPost.id,
      data: {
        scheduled_date: newDate,
        ...(draggedPost.status === PostStatus.UNUSED &&
          isDestInFuture && { status: PostStatus.DRAFT }),
      },
    });
    // Warn if the post's time is already past on the target day — the drop is
    // allowed (month view only changes date, user can adjust time in the editor)
    // but the user should know the scheduled time needs updating.
    if (newDate === todayLocal() && postHour !== null && postHour <= new Date().getHours()) {
      toast.warning(COPY.socialCalendar.draggedToPastTime);
    }
    setDraggedPost(null);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
      {/* Week Days Header — month view only */}
      {viewType === 'month' && (
        <div className="grid grid-cols-7 border-b-2 border-gray-200 dark:border-gray-600">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-4 bg-gray-100 dark:bg-gray-800/80 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      {viewType === 'day' ? (
        <DayView
          day={days[0]}
          posts={getPostsForDay(days[0])}
          onAddPost={onAddPost}
          onEditPost={onEditPost}
          onRequestDelete={setDeleteTarget}
          updatePostMutation={updatePostMutation}
          draggedPost={draggedPost}
          setDraggedPost={setDraggedPost}
        />
      ) : viewType === 'week' ? (
        <WeekView
          days={days}
          getPostsForDay={getPostsForDay}
          onAddPost={onAddPost}
          onEditPost={onEditPost}
          updatePostMutation={updatePostMutation}
          draggedPost={draggedPost}
          setDraggedPost={setDraggedPost}
          showPopover={showPopover}
          hidePopover={hidePopover}
          onShowDayPosts={(day) => setDayPostsModal({ date: day, posts: getPostsForDay(day) })}
        />
      ) : (
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayPosts = getPostsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const hasMultiple = dayPosts.length > 2;

            const dayStr = format(day, 'yyyy-MM-dd');
            const isDragOver = draggedPost && dragOverDate === dayStr;
            const dropWouldBePast = isDragOver && isDropInPast(day);
            const isDragOverPast = isDragOver && dropWouldBePast;
            const isDragOverValid = isDragOver && !dropWouldBePast;

            return (
              <div
                key={idx}
                className={`min-h-[140px] p-3 border-b border-r transition-colors ${
                  isDragOverValid
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 ring-2 ring-inset ring-violet-400'
                    : isDragOverPast
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 ring-2 ring-inset ring-red-300 cursor-not-allowed'
                      : `border-gray-200 dark:border-gray-600 ${
                          isCurrentMonth
                            ? 'bg-white dark:bg-gray-800'
                            : 'bg-gray-100 dark:bg-gray-900/50'
                        }`
                } ${!isDragOver && isToday ? 'bg-violet-50 dark:bg-violet-900/20 ring-2 ring-inset ring-violet-400' : ''} ${
                  idx % 7 === 6 ? 'border-r-0' : ''
                } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={(e) => {
                  if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))
                    return;
                  setDragOverDate(null);
                }}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div
                  className={`text-base font-bold mb-3 flex items-center justify-between ${
                    isCurrentMonth
                      ? isToday
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span
                    className={`${isToday ? 'bg-violet-600 dark:bg-violet-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <Badge className="text-xs h-6 px-2 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-semibold">
                      {dayPosts.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  {dayPosts.slice(0, 2).map((post) => {
                    const styles = getPostStatusStyles(post.status);
                    return (
                      <div
                        key={post.id}
                        role="button"
                        tabIndex={0}
                        draggable={post.status !== PostStatus.PUBLISHED}
                        onDragStart={(e) => handleDragStart(e, post)}
                        onDragEnd={() => {
                          setDraggedPost(null);
                          setDragOverDate(null);
                        }}
                        onMouseEnter={(e) => showPopover(post, e)}
                        onMouseLeave={hidePopover}
                        onClick={() => onEditPost(post)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onEditPost(post);
                          }
                        }}
                        className={`text-sm p-2 rounded-lg border-2 transition-all hover:shadow-md group/post ${
                          post.status === PostStatus.PUBLISHED ? 'cursor-pointer' : 'cursor-move'
                        } ${styles.bgClass} ${styles.borderClass} ${
                          draggedPost?.id === post.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <PlatformBadges platforms={post.platforms ?? []} size="sm" />
                            <span className="truncate text-gray-800 dark:text-gray-200 font-semibold">
                              {getPostCardLabel(post, { maxLen: 20 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <PostStatusChip status={post.status} iconOnly />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hasMultiple && (
                    <button
                      onClick={() => setDayPostsModal({ date: day, posts: dayPosts })}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline w-full text-left font-semibold"
                    >
                      +{dayPosts.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event hover popover */}
      {hoveredPost && (
        <div
          onMouseEnter={keepPopover}
          onMouseLeave={hidePopover}
          className="fixed z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl p-4"
          style={{
            left: Math.min(popoverPos.x, window.innerWidth - 300),
            ...(popoverPos.above
              ? { bottom: window.innerHeight - popoverPos.y + 8 }
              : { top: popoverPos.y + 8 }),
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
              {getPostCardLabel(hoveredPost, { maxLen: 30, preferTitle: true })}
            </p>
            <PostStatusChip status={hoveredPost.status} />
          </div>
          {hoveredPost.caption && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
              {hoveredPost.caption}
            </p>
          )}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <PlatformBadges platforms={hoveredPost.platforms ?? []} size="lg" />
          </div>
          {(hoveredPost.scheduled_date || hoveredPost.scheduled_time) && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {hoveredPost.scheduled_date}
              {hoveredPost.scheduled_time ? ` at ${hoveredPost.scheduled_time}` : ''}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setHoveredPost(null);
                onEditPost(hoveredPost);
              }}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                const target = hoveredPost;
                setHoveredPost(null);
                setDeleteTarget(target);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Day posts modal — shown when clicking "+N more" */}
      <DayPostsDialog
        open={!!dayPostsModal}
        onClose={() => setDayPostsModal(null)}
        posts={dayPostsModal?.posts ?? []}
        date={dayPostsModal?.date ?? null}
        onEditPost={onEditPost}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={getDeletePostTitle(deleteTarget)}
        description={buildDeletePostDescription(deleteTarget)}
        confirmLabel={
          hasBeenPublished(deleteTarget)
            ? COPY.deletedPosts.dialogs.deletePublished.confirm
            : COPY.deletedPosts.dialogs.deleteDraft.confirm
        }
        cancelLabel={COPY.deletedPosts.dialogs.deletePublished.cancel}
        isLoading={deletePostMutation.isPending}
      />
    </Card>
  );
}
