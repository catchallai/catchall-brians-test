import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

export default function ActivityCalendarView({ activities, onActivityClick, onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getActivitiesForDay = (day) => {
    return activities.filter((activity) => {
      if (!activity.due_date) {
        return false;
      }
      return isSameDay(new Date(activity.due_date), day);
    });
  };

  const getActivityColor = (activity) => {
    if (activity.completed) {
      return 'bg-gray-200 text-gray-600';
    }
    if (activity.priority === 'high') {
      return 'bg-red-100 text-red-700';
    }
    if (activity.priority === 'medium') {
      return 'bg-amber-100 text-amber-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="glass-card">
        <div className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayActivities = getActivitiesForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 rounded-lg border transition-all cursor-pointer ${
                    isCurrentMonth
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
                  } ${isToday ? 'ring-2 ring-violet-500' : ''}`}
                  onClick={() => onDateClick?.(day)}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity) => (
                      <div
                        key={activity.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${getActivityColor(activity)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivityClick?.(activity);
                        }}
                        title={activity.title}
                      >
                        {activity.title}
                      </div>
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1.5">
                        +{dayActivities.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100"></div>
          <span className="text-gray-600 dark:text-gray-400">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100"></div>
          <span className="text-gray-600 dark:text-gray-400">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100"></div>
          <span className="text-gray-600 dark:text-gray-400">Low Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-200"></div>
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
      </div>
    </div>
  );
}
