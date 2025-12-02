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
      <div className="flex items-center justify-between p-5 border-b-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-bold text-2xl text-gray-900 dark:text-white min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
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
      <div className="grid grid-cols-7 border-b-2 border-gray-200 dark:border-gray-600">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-4 bg-gray-100 dark:bg-gray-800/80 uppercase tracking-wide">
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
              className={`min-h-[140px] p-3 border-b border-r border-gray-200 dark:border-gray-600 transition-colors ${
                isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800' 
                  : 'bg-gray-100 dark:bg-gray-900/50'
              } ${isToday ? 'bg-violet-50 dark:bg-violet-900/20 ring-2 ring-inset ring-violet-400' : ''} ${
                idx % 7 === 6 ? 'border-r-0' : ''
              } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
            >
              {/* Day Number */}
              <div className={`text-base font-bold mb-3 flex items-center justify-between ${
                isCurrentMonth 
                  ? (isToday ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-gray-100') 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                <span className={`${isToday ? 'bg-violet-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayPosts.length > 0 && (
                  <Badge className="text-xs h-6 px-2 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 font-semibold">
                    {dayPosts.length}
                  </Badge>
                )}
              </div>

              {/* Posts */}
              <div className="space-y-1.5">
                {dayPosts.slice(0, 2).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onEditPost(post)}
                    className={`text-sm p-2 rounded-lg cursor-pointer border-2 transition-all hover:shadow-md hover:scale-[1.02] ${
                      statusColors[post.status] || statusColors.draft
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {post.platform && (
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${platformColors[post.platform] || 'bg-gray-400'}`} />
                      )}
                      <span className="truncate text-gray-800 dark:text-gray-200 font-semibold">
                        {post.caption?.slice(0, 18) || 'Untitled'}
                        {post.caption?.length > 18 ? '...' : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {hasMultiple && (
                  <button 
                    onClick={() => onEditPost(dayPosts[0])}
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