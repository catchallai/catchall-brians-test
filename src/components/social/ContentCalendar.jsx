import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { PLATFORMS, PLATFORM_MAP_LOWER } from '@/constants/platforms';

export default function ContentCalendar({ posts, onAddPost, onEditPost }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (day) => {
    return posts.filter((post) => {
      if (!post.scheduled_time) {
        return false;
      }
      return isSameDay(new Date(post.scheduled_time), day);
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-0 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => onAddPost()}
          className="gap-1 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" /> Add Post
        </Button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`min-h-24 p-1 rounded-lg border transition-colors ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'border-violet-300 bg-violet-50' : 'border-gray-100'}`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isCurrentMonth ? (isToday ? 'text-violet-600' : 'text-gray-700') : 'text-gray-300'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onEditPost(post)}
                    className={`text-xs p-1 rounded cursor-pointer truncate text-white border border-white/20 ${PLATFORM_MAP_LOWER[post.platform]?.tailwindGradient || PLATFORM_MAP_LOWER[post.platform]?.tailwind || 'bg-gray-500'}`}
                  >
                    {format(new Date(post.scheduled_time), 'HH:mm')} - {post.content?.slice(0, 15)}
                    ...
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-4 pt-4 border-t flex-wrap">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="flex items-center gap-1">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center ${p.tailwindGradient || p.tailwind}`}
              >
                <Icon size={9} color="white" />
              </div>
              <span className="text-xs text-gray-500">{p.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
