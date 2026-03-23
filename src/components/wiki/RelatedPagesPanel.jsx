import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RelatedPagesPanel({ currentPage }) {
  const { data: allPages = [] } = useQuery({
    queryKey: ['space-pages', currentPage?.space_id],
    queryFn: async () => {
      if (!currentPage) {
        return [];
      }
      const pages = await base44.entities.WikiPage.list();
      return pages.filter((p) => p.space_id === currentPage.space_id && p.id !== currentPage.id);
    },
    enabled: !!currentPage,
  });

  // Find related pages based on tags, content similarity, and links
  const relatedPages = React.useMemo(() => {
    if (!currentPage || !allPages.length) {
      return [];
    }

    const scored = allPages.map((page) => {
      let score = 0;

      // Same folder
      if (page.folder_id && page.folder_id === currentPage.folder_id) {
        score += 3;
      }

      // Shared tags
      const currentTags = currentPage.tags || [];
      const pageTags = page.tags || [];
      const sharedTags = currentTags.filter((t) => pageTags.includes(t));
      score += sharedTags.length * 2;

      // Linked pages
      if (currentPage.linked_pages?.includes(page.id)) {
        score += 5;
      }

      // Same parent
      if (page.parent_page_id === currentPage.parent_page_id && page.parent_page_id) {
        score += 2;
      }

      // Recently updated
      const daysSinceUpdate = (new Date() - new Date(page.updated_date)) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 1;
      }

      return { page, score };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.page);
  }, [currentPage, allPages]);

  if (!currentPage || relatedPages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4 text-violet-600" />
          Related Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {relatedPages.map((page) => (
            <Link
              key={page.id}
              to={`${createPageUrl('WikiPageEditor')}?spaceId=${page.space_id}&pageId=${page.id}`}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600">
                  {page.title}
                </p>
                {page.ai_summary && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{page.ai_summary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
