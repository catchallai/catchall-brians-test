import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';

export default function FullTextSearch({ spaceId, onPageSelect }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: results = [] } = useQuery({
    queryKey: ['search-pages', query, spaceId],
    queryFn: async () => {
      if (query.length < 2) {
        return [];
      }

      const allPages = await base44.entities.WikiPage.list();
      const lowerQuery = query.toLowerCase();

      let filtered = allPages.filter((p) => !p.template);
      if (spaceId) {
        filtered = filtered.filter((p) => p.space_id === spaceId);
      }

      // Search in title, content, tags
      return filtered
        .map((page) => {
          let score = 0;

          // Title match (highest priority)
          if (page.title.toLowerCase().includes(lowerQuery)) {
            score += 10;
          }

          // Content match
          const plainContent = page.content?.replace(/<[^>]*>/g, '') || '';
          if (plainContent.toLowerCase().includes(lowerQuery)) {
            score += 5;
          }

          // Tags match
          if (page.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
            score += 7;
          }

          // AI summary match
          if (page.ai_summary?.toLowerCase().includes(lowerQuery)) {
            score += 6;
          }

          // Extract snippet
          const contentIndex = plainContent.toLowerCase().indexOf(lowerQuery);
          const snippet =
            contentIndex >= 0
              ? '...' +
                plainContent.substring(Math.max(0, contentIndex - 40), contentIndex + 100) +
                '...'
              : page.ai_summary || plainContent.substring(0, 120) + '...';

          return { page, score, snippet };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
    enabled: query.length >= 2,
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

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search all pages... (Cmd+F)"
          className="pl-10"
        />
      </div>

      {showResults && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-xl">
          <ScrollArea className="max-h-96">
            <div className="p-2 space-y-1">
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No results found for "{query}"</div>
              ) : (
                results.map(({ page, snippet }) => (
                  <Link
                    key={page.id}
                    to={`${createPageUrl('WikiPageEditor')}?spaceId=${page.space_id}&pageId=${page.id}`}
                    onClick={() => {
                      if (onPageSelect) {
                        onPageSelect(page);
                      }
                      setShowResults(false);
                    }}
                    className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {page.title}
                          </p>
                          {bookmarkedPageIds.includes(page.id) && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{snippet}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {page.view_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {page.view_count} views
                            </Badge>
                          )}
                          {page.status !== 'published' && (
                            <Badge variant="outline" className="text-xs">
                              {page.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
