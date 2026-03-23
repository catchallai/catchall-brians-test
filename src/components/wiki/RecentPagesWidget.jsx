import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Clock, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';

export default function RecentPagesWidget({ spaceId, limit = 5 }) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: recentPages = [] } = useQuery({
    queryKey: ['recent-pages', user?.email, spaceId],
    queryFn: async () => {
      const allPages = await base44.entities.WikiPage.list('-last_viewed_at', limit * 2);
      let filtered = allPages.filter((p) => !p.template);
      if (spaceId) {
        filtered = filtered.filter((p) => p.space_id === spaceId);
      }
      return filtered.slice(0, limit);
    },
    enabled: !!user,
  });

  const { data: mostViewed = [] } = useQuery({
    queryKey: ['most-viewed-pages', spaceId],
    queryFn: async () => {
      const allPages = await base44.entities.WikiPage.list();
      let filtered = allPages.filter((p) => !p.template && p.view_count > 0);
      if (spaceId) {
        filtered = filtered.filter((p) => p.space_id === spaceId);
      }
      return filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, limit);
    },
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['user-bookmarks', user?.email],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      const allBookmarks = await base44.entities.WikiPageBookmark.list();
      return allBookmarks.filter((b) => b.user_email === user.email);
    },
    enabled: !!user,
  });

  const bookmarkedPageIds = bookmarks.map((b) => b.page_id);

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) {
      return '';
    }
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    }
    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return 'Just now';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-violet-600" />
            Recently Viewed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPages.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No recent pages</p>
            ) : (
              recentPages.map((page) => (
                <Link
                  key={page.id}
                  to={`${createPageUrl('WikiPageEditor')}?spaceId=${page.space_id}&pageId=${page.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600">
                      {page.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(page.last_viewed_at)}
                    </p>
                  </div>
                  {bookmarkedPageIds.includes(page.id) && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  )}
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Viewed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Most Viewed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mostViewed.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No viewed pages yet</p>
            ) : (
              mostViewed.map((page) => (
                <Link
                  key={page.id}
                  to={`${createPageUrl('WikiPageEditor')}?spaceId=${page.space_id}&pageId=${page.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600">
                      {page.title}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {page.view_count} views
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
