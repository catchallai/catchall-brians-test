import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek 
} from "date-fns";

const platformColors = {
  twitter: "bg-gray-900",
  linkedin: "bg-blue-600",
  facebook: "bg-blue-500",
  instagram: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
  youtube: "bg-red-600",
  tiktok: "bg-black",
};

const statusColors = {
  draft: "border-gray-300 bg-gray-50",
  scheduled: "border-blue-300 bg-blue-50",
  approved: "border-emerald-300 bg-emerald-50",
  published: "border-violet-300 bg-violet-50",
};

export default function SocialCalendarView({ posts = [], onAddPost, onEditPost, currentMonth, onMonthChange }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (day) => {
    return posts.filter(post => {
      if (!post.scheduled_date) return false;
      return isSameDay(new Date(post.scheduled_date), day);
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button size="sm" onClick={onAddPost} className="gap-1 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" /> Add Post
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-3 bg-gray-50 dark:bg-gray-800/50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const hasMultiple = dayPosts.length > 2;

          return (
            <div
              key={idx}
              className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 transition-colors ${
                isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800' 
                  : 'bg-gray-50 dark:bg-gray-900/50'
              } ${isToday ? 'bg-violet-50 dark:bg-violet-900/20' : ''} ${
                idx % 7 === 6 ? 'border-r-0' : ''
              } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
            >
              {/* Day Number */}
              <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                isCurrentMonth 
                  ? (isToday ? 'text-violet-600 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300') 
                  : 'text-gray-300 dark:text-gray-600'
              }`}>
                <span className={`${isToday ? 'bg-violet-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayPosts.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {dayPosts.length}
                  </Badge>
                )}
              </div>

              {/* Posts */}
              <div className="space-y-1">
                {dayPosts.slice(0, 2).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onEditPost(post)}
                    className={`text-xs p-1.5 rounded-md cursor-pointer border transition-all hover:shadow-sm ${
                      statusColors[post.status] || statusColors.draft
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {post.platform && (
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${platformColors[post.platform] || 'bg-gray-400'}`} />
                      )}
                      <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                        {post.caption?.slice(0, 20) || 'Untitled'}
                        {post.caption?.length > 20 ? '...' : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {hasMultiple && (
                  <button 
                    onClick={() => onEditPost(dayPosts[0])}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline w-full text-left pl-1"
                  >
                    +{dayPosts.length - 2} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(platformColors).slice(0, 5).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{platform}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-gray-300 bg-gray-50" />
            <span className="text-xs text-gray-500">Draft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-emerald-300 bg-emerald-50" />
            <span className="text-xs text-gray-500">Approved</span>
          </div>
        </div>
      </div>
    </Card>
  );
}