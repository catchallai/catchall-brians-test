import React from 'react';
import { format, isSameDay } from 'date-fns';

export default function CalendarDayCell({ day, posts, onPostClick, isSelected, isCurrentMonth, isToday }) {
  return (
    <div className={`p-2 min-h-32 space-y-1 overflow-y-auto transition-colors ${
      isToday 
        ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500'
        : isCurrentMonth
        ? 'bg-white dark:bg-slate-800'
        : 'bg-gray-50 dark:bg-slate-900/30'
    }`}>
      <p className={`text-xs font-semibold ${
        isToday ? 'text-blue-600 dark:text-blue-400' :
        isCurrentMonth ? 'text-gray-700 dark:text-gray-200' :
        'text-gray-400 dark:text-gray-600'
      }`}>
        {format(day, 'd')}
      </p>
      <div className="space-y-1">
        {posts.map(post => (
          <button
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className={`w-full text-left p-1.5 text-xs rounded-md cursor-move transition-all truncate ${
              isSelected
                ? 'bg-violet-500 text-white ring-1 ring-violet-600'
                : 'bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 text-gray-700 dark:text-gray-200 hover:from-violet-200 hover:to-blue-200'
            }`}
            title={post.caption}
          >
            {post.title || post.caption?.substring(0, 20)}
          </button>
        ))}
      </div>
    </div>
  );
}