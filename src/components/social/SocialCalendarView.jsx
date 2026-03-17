import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays
} from "date-fns";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const platformColors = {
  twitter: "bg-gray-900",
  linkedin: "bg-blue-600",
  facebook: "bg-blue-500",
  instagram: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
  youtube: "bg-red-600",
  tiktok: "bg-black",
};

// Solid left-border colors per platform (for suggestion #8)
const platformBorderColors = {
  twitter: "border-l-gray-800",
  linkedin: "border-l-blue-600",
  facebook: "border-l-blue-500",
  instagram: "border-l-pink-500",
  youtube: "border-l-red-600",
  tiktok: "border-l-black",
};

const statusColors = {
  draft: "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600",
  pending_approval: "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600",
  approved: "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600",
  published: "border-violet-300 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-600",
};

const statusBadges = {
  draft: { label: "Draft", class: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  pending_approval: { label: "Pending", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  approved: { label: "Approved", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  published: { label: "Published", class: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function getPostHour(post) {
  if (!post.scheduled_time) return null;
  const match = post.scheduled_time.match(/^(\d{1,2}):(\d{2})/);
  if (match) return parseInt(match[1]);
  return null;
}

// Overnight hours to collapse by default (#6)
const OVERNIGHT_HOURS = [1, 2, 3, 4, 5];

function DayView({ day, posts, onAddPost, onEditPost, deletePostMutation, updatePostMutation, draggedPost, setDraggedPost, platformColors, platformBorderColors, statusColors, statusBadges }) {
  const isToday = isSameDay(day, new Date());
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
      if (hourEl) hourEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [isToday, day]);

  // Group posts by hour
  const postsByHour = {};
  const untimedPosts = [];
  posts.forEach(post => {
    const h = getPostHour(post);
    if (h !== null) {
      if (!postsByHour[h]) postsByHour[h] = [];
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
  const handleHourDragOver = (e, hour) => {
    e.preventDefault();
    setDraggingOver(hour);
  };

  const handleHourDrop = (e, hour) => {
    e.preventDefault();
    setDraggingOver(null);
    if (draggedPost) {
      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      updatePostMutation.mutate({
        id: draggedPost.id,
        data: { ...draggedPost, scheduled_time: timeStr }
      });
      setDraggedPost(null);
    }
  };

  const visibleOvernightCount = OVERNIGHT_HOURS.reduce((acc, h) => acc + (postsByHour[h]?.length || 0), 0);

  // #2 Current time indicator position (% within the hour slot)
  const nowMinutePct = (nowMinute / 60) * 100;

  return (
    <div className="overflow-y-auto max-h-[700px]" ref={scrollRef}>
      {/* #7 Post count badge in header area */}
      {posts.length > 0 && (
        <div className="px-4 py-2 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800 flex items-center gap-2">
          <Badge className="bg-violet-600 text-white text-xs">{posts.length} post{posts.length !== 1 ? 's' : ''} today</Badge>
          <span className="text-xs text-violet-600 dark:text-violet-400">
            {Object.keys(postsByHour).length} time slot{Object.keys(postsByHour).length !== 1 ? 's' : ''} scheduled
          </span>
        </div>
      )}

      {/* All-day / untimed posts */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 min-h-[40px]">
        <div className="w-20 flex-shrink-0 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 font-medium border-r border-gray-200 dark:border-gray-600">
          all-day
        </div>
        <div className="flex-1 px-3 py-2 flex flex-wrap gap-2">
          {untimedPosts.map(post => {
            const statusInfo = statusBadges[post.status] || statusBadges.draft;
            const borderColor = platformBorderColors[post.platforms?.[0]] || 'border-l-gray-400';
            return (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => { setDraggedPost(post); e.dataTransfer.effectAllowed = 'move'; }}
                onClick={() => onEditPost(post)}
                className={`text-xs px-2 py-1 rounded-md cursor-pointer border border-l-4 ${borderColor} flex items-center gap-1.5 group/post ${statusColors[post.status] || statusColors.draft} ${draggedPost?.id === post.id ? 'opacity-50' : ''}`}
              >
                <span className="text-gray-800 dark:text-gray-200 font-medium">{post.title || post.caption?.slice(0, 20) || 'Untitled'}</span>
                <Badge className={`text-xs px-1 ${statusInfo.class}`}>{statusInfo.label}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* #6 Overnight collapse toggle */}
      {!showOvernight && (
        <button
          onClick={() => setShowOvernight(true)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
          <span>Show overnight hours (1 AM – 5 AM){visibleOvernightCount > 0 ? ` · ${visibleOvernightCount} post${visibleOvernightCount !== 1 ? 's' : ''}` : ''}</span>
        </button>
      )}

      {/* Hourly rows */}
      {HOURS.map(hour => {
        // #6 Skip overnight hours if collapsed
        if (!showOvernight && OVERNIGHT_HOURS.includes(hour)) return null;

        const hourPosts = postsByHour[hour] || [];
        const isCurrentHour = isToday && hour === nowHour;
        const isDragTarget = draggingOver === hour;

        return (
          <div
            key={hour}
            data-hour={hour}
            className={`flex border-b border-gray-100 dark:border-gray-700 min-h-[80px] group/hour relative cursor-pointer transition-colors ${
              isDragTarget
                ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-inset ring-violet-400'
                : isCurrentHour
                  ? 'bg-violet-50 dark:bg-violet-900/20'
                  : 'bg-white dark:bg-gray-800 hover:bg-violet-50/30 dark:hover:bg-violet-900/10'
            }`}
            onClick={() => handleHourClick(hour)}
            onDragOver={(e) => handleHourDragOver(e, hour)}
            onDragLeave={() => setDraggingOver(null)}
            onDrop={(e) => handleHourDrop(e, hour)}
          >
            <div className={`w-20 flex-shrink-0 px-3 pt-3 text-xs font-medium border-r border-gray-100 dark:border-gray-700 ${isCurrentHour ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatHour(hour)}
            </div>

            <div className="flex-1 px-3 py-2 flex flex-col gap-1.5 relative" onClick={e => e.stopPropagation()}>
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

              {hourPosts.map(post => {
                const statusInfo = statusBadges[post.status] || statusBadges.draft;
                // #8 Platform color left border
                const borderColor = platformBorderColors[post.platforms?.[0]] || 'border-l-gray-400';
                return (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={(e) => { setDraggedPost(post); e.dataTransfer.effectAllowed = 'move'; }}
                    className={`text-sm p-2 pl-3 rounded-lg cursor-move border border-l-4 ${borderColor} transition-all hover:shadow-md group/post ${statusColors[post.status] || statusColors.draft} ${draggedPost?.id === post.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => onEditPost(post)}>
                        {/* #8: show platform name instead of tiny dot since border carries color */}
                        {post.platforms?.[0] && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize flex-shrink-0">{post.platforms[0]}</span>
                        )}
                        <span className="truncate text-gray-800 dark:text-gray-200 font-semibold">
                          {post.title || post.caption?.slice(0, 40) || 'Untitled'}
                        </span>
                        {post.scheduled_time && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{post.scheduled_time}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge className={`text-xs px-1.5 py-0.5 ${statusInfo.class}`}>{statusInfo.label}</Badge>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this post?')) deletePostMutation.mutate(post.id); }}
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
                    onClick={(e) => { e.stopPropagation(); handleHourClick(hour); }}
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
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          <span>Hide overnight hours</span>
        </button>
      )}
    </div>
  );
}

export default function SocialCalendarView({ posts = [], onAddPost, onEditPost, onDeletePost, currentMonth, onMonthChange, viewType = 'month' }) {
  const [draggedPost, setDraggedPost] = useState(null);
  const queryClient = useQueryClient();

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-posts'] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-posts'] }),
  });

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
    return posts.filter(post => {
      if (!post.scheduled_date) return false;
      return isSameDay(new Date(post.scheduled_date), day);
    });
  };

  const handleDragStart = (e, post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (draggedPost) {
      const newDate = format(targetDate, 'yyyy-MM-dd');
      updatePostMutation.mutate({
        id: draggedPost.id,
        data: { ...draggedPost, scheduled_date: newDate }
      });
      setDraggedPost(null);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              if (viewType === 'day') {
                onMonthChange(addDays(currentMonth, -1));
              } else if (viewType === 'week') {
                onMonthChange(addDays(currentMonth, -7));
              } else {
                onMonthChange(subMonths(currentMonth, 1));
              }
            }}
            className="h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-bold text-2xl text-gray-900 dark:text-white min-w-[200px] text-center">
            {viewType === 'day'
              ? format(currentMonth, 'EEEE, MMMM d, yyyy')
              : viewType === 'week' 
                ? `Week of ${format(startOfWeek(currentMonth), 'MMM d, yyyy')}`
                : format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              if (viewType === 'day') {
                onMonthChange(addDays(currentMonth, 1));
              } else if (viewType === 'week') {
                onMonthChange(addDays(currentMonth, 7));
              } else {
                onMonthChange(addMonths(currentMonth, 1));
              }
            }}
            className="h-10 w-10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <Button size="lg" onClick={onAddPost} className="gap-2 bg-violet-600 hover:bg-violet-700 font-semibold">
          <Plus className="w-5 h-5" /> Add Post
        </Button>
      </div>

      {/* Week Days Header */}
      {viewType !== 'day' && (
        <div className={`grid ${viewType === 'week' ? 'grid-cols-7' : 'grid-cols-7'} border-b-2 border-gray-200 dark:border-gray-600`}>
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-4 bg-gray-100 dark:bg-gray-800/80 uppercase tracking-wide">
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
          deletePostMutation={deletePostMutation}
          updatePostMutation={updatePostMutation}
          draggedPost={draggedPost}
          setDraggedPost={setDraggedPost}
          platformColors={platformColors}
          platformBorderColors={platformBorderColors}
          statusColors={statusColors}
          statusBadges={statusBadges}
        />
      ) : (
        <div className={`grid ${viewType === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
          {days.map((day, idx) => {
            const dayPosts = getPostsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const hasMultiple = dayPosts.length > 2;

            return (
              <div
                key={idx}
                className={`min-h-[140px] p-3 border-b border-r border-gray-200 dark:border-gray-600 transition-colors ${
                  isCurrentMonth 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-gray-100 dark:bg-gray-900/50'
                } ${isToday ? 'bg-violet-50 dark:bg-violet-900/20 ring-2 ring-inset ring-violet-400' : ''} ${
                  idx % 7 === 6 ? 'border-r-0' : ''
                } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className={`text-base font-bold mb-3 flex items-center justify-between ${
                  isCurrentMonth 
                    ? (isToday ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-gray-100') 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  <span className={`${isToday ? 'bg-violet-600 dark:bg-violet-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm' : ''}`}>
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
                    const statusInfo = statusBadges[post.status] || statusBadges.draft;
                    return (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post)}
                        className={`text-sm p-2 rounded-lg cursor-move border-2 transition-all hover:shadow-md group/post ${
                          statusColors[post.status] || statusColors.draft
                        } ${draggedPost?.id === post.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => onEditPost(post)}>
                            {post.platforms?.[0] && (
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${platformColors[post.platforms[0]] || 'bg-gray-400'}`} />
                            )}
                            <span className="truncate text-gray-800 dark:text-gray-200 font-semibold">
                              {post.title || post.caption?.slice(0, 18) || 'Untitled'}
                              {(post.caption?.length > 18 && !post.title) ? '...' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge className={`text-xs px-1.5 py-0.5 ${statusInfo.class}`}>{statusInfo.label}</Badge>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm('Delete this post?')) deletePostMutation.mutate(post.id); }}
                              className="opacity-0 group-hover/post:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hasMultiple && (
                    <button onClick={() => onEditPost(dayPosts[0])} className="text-sm text-violet-600 dark:text-violet-400 hover:underline w-full text-left font-semibold">
                      +{dayPosts.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(platformColors).slice(0, 5).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize font-medium">{platform}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Draft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/30" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Published</span>
          </div>
        </div>
      </div>
    </Card>
  );
}