import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Clock, Star, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function QuickNavigationDialog({ open, onClose, spaceId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: pages = [] } = useQuery({
    queryKey: ['quick-nav-pages', spaceId],
    queryFn: async () => {
      const allPages = await base44.entities.WikiPage.list();
      return spaceId ? allPages.filter((p) => p.space_id === spaceId) : allPages;
    },
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['user-bookmarks'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const allBookmarks = await base44.entities.WikiPageBookmark.list();
      return allBookmarks.filter((b) => b.user_email === user.email);
    },
  });

  const filteredPages = pages
    .filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10);

  const bookmarkedPageIds = bookmarks.map((b) => b.page_id);

  const handleNavigate = (page) => {
    const viewCount = (page.view_count || 0) + 1;
    base44.entities.WikiPage.update(page.id, {
      view_count: viewCount,
      last_viewed_at: new Date().toISOString(),
    });
    navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${page.space_id}&pageId=${page.id}`);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Navigation</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-2 pr-4">
            {filteredPages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pages found</div>
            ) : (
              filteredPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavigate(page)}
                  className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600">
                          {page.title}
                        </p>
                        {bookmarkedPageIds.includes(page.id) && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {page.ai_summary && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{page.ai_summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {page.view_count > 0 && (
                        <Badge variant="secondary">{page.view_count} views</Badge>
                      )}
                      {page.last_viewed_at && <Clock className="w-3 h-3" />}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="text-xs text-gray-500 border-t pt-3">
          Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Cmd+K</kbd> or{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+K</kbd> to open
        </div>
      </DialogContent>
    </Dialog>
  );
}
