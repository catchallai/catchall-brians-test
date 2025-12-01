import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isFuture } from "date-fns";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const platformColors = {
  twitter: "bg-gray-900 text-white",
  linkedin: "bg-blue-600 text-white",
  facebook: "bg-blue-500 text-white",
  instagram: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white",
  youtube: "bg-red-600 text-white",
};

export default function ContentCalendarCard({ posts, brands }) {
  const upcomingPosts = posts
    .filter(p => p.status !== 'published' && p.scheduled_date && isFuture(new Date(p.scheduled_date)))
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5);

  const todayPosts = posts.filter(p => p.scheduled_date && isToday(new Date(p.scheduled_date))).length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;

  const getBrandName = (brandId) => brands.find(b => b.id === brandId)?.name || 'Unknown';

  const getDateLabel = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-500" />
            Content Calendar
          </span>
          {todayPosts > 0 && (
            <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-0">
              {todayPosts} today
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{scheduledPosts}</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{draftPosts}</p>
            <p className="text-xs text-gray-500">Drafts</p>
          </div>
          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {posts.filter(p => p.status === 'published').length}
            </p>
            <p className="text-xs text-gray-500">Published</p>
          </div>
        </div>

        {/* Upcoming Posts */}
        {upcomingPosts.length > 0 ? (
          <div className="space-y-2">
            {upcomingPosts.map((post) => (
              <div 
                key={post.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${platformColors[post.platform] || 'bg-gray-500 text-white'} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                  {post.platform?.[0]?.toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {post.content?.slice(0, 40) || 'Untitled post'}...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getBrandName(post.brand_id)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {getDateLabel(post.scheduled_date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(post.scheduled_date), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming posts scheduled</p>
          </div>
        )}

        <Link 
          to={createPageUrl('SocialCalendar')}
          className="block text-center text-sm text-violet-600 dark:text-violet-400 hover:underline py-2"
        >
          View Full Calendar →
        </Link>
      </CardContent>
    </Card>
  );
}