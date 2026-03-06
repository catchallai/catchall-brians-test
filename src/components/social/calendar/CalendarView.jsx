import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({
  currentDate,
  onPrevMonth,
  onNextMonth,
  viewType, // 'month' | 'week'
  posts,
  onPostDrop,
  onSelectPost,
  selectedPost,
  filters,
}) {
  const start = viewType === 'month' 
    ? startOfWeek(startOfMonth(currentDate))
    : startOfWeek(currentDate);
  
  const end = viewType === 'month'
    ? endOfWeek(endOfMonth(currentDate))
    : endOfWeek(currentDate);

  const days = eachDayOfInterval({ start, end });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Filter posts based on current filters
  const filteredPosts = posts.filter(post => {
    const matchPlatform = !filters.platforms.length || 
      post.platforms?.some(p => filters.platforms.includes(p));
    const matchBrief = !filters.briefs.length || 
      post.campaign_brief_id && filters.briefs.includes(post.campaign_brief_id);
    const matchStatus = !filters.statuses.length || 
      filters.statuses.includes(post.status);
    return matchPlatform && matchBrief && matchStatus;
  });

  // Group posts by date
  const postsByDate = {};
  filteredPosts.forEach(post => {
    const date = post.scheduled_date;
    if (!postsByDate[date]) postsByDate[date] = [];
    postsByDate[date].push(post);
  });

  return (
    <DragDropContext onDragEnd={onPostDrop}>
      <div className="space-y-4">
        {/* Month/Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onPrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white min-w-48 text-center">
              {viewType === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`}
            </h2>
            <Button size="sm" variant="outline" onClick={onNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            {filteredPosts.length} posts {filters.platforms.length > 0 && `(${filters.platforms.length} platform${filters.platforms.length > 1 ? 's' : ''})`}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-100 dark:border-slate-700">
            {DAYS.map(day => (
              <div key={day} className="p-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-0 divide-x divide-gray-100 dark:divide-slate-700 min-h-32">
                {week.map((day, dayIdx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayPosts = postsByDate[dateStr] || [];
                  const isCurrentMonth = viewType === 'month' ? isSameMonth(day, currentDate) : true;
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedPost && isSameDay(new Date(selectedPost.scheduled_date), day);

                  return (
                    <Droppable key={dateStr} droppableId={dateStr}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 space-y-1 overflow-y-auto max-h-40 transition-colors ${
                            isToday 
                              ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500'
                              : isCurrentMonth
                              ? 'bg-white dark:bg-slate-800'
                              : 'bg-gray-50 dark:bg-slate-900/30'
                          } ${snapshot.isDraggingOver && 'bg-violet-100 dark:bg-violet-900/20'}`}
                        >
                          <p className={`text-xs font-semibold ${
                            isToday ? 'text-blue-600 dark:text-blue-400' :
                            isCurrentMonth ? 'text-gray-700 dark:text-gray-200' :
                            'text-gray-400 dark:text-gray-600'
                          }`}>
                            {format(day, 'd')}
                          </p>

                          {dayPosts.map((post, idx) => (
                            <Draggable key={post.id} draggableId={post.id} index={idx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => !snapshot.isDragging && onSelectPost(post)}
                                  className={`p-1.5 text-xs rounded-md cursor-move transition-all ${
                                    isSelected
                                      ? 'bg-violet-500 text-white ring-1 ring-violet-600'
                                      : 'bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 text-gray-700 dark:text-gray-200 hover:from-violet-200 hover:to-blue-200'
                                  } ${snapshot.isDragging && 'shadow-lg'}`}
                                >
                                  <div className="font-medium truncate">{post.title || post.caption?.substring(0, 20)}</div>
                                  <div className="text-[10px] opacity-75 flex gap-1 flex-wrap mt-0.5">
                                    {post.platforms?.slice(0, 2).map(p => (
                                      <span key={p} className="px-1 py-0.5 rounded bg-black/10">{p.slice(0, 3)}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}

                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}