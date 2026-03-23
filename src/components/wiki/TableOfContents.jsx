import { Card } from '@/components/ui/card';
import { FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TableOfContents({ pages, spaceId }) {
  const rootPages = pages
    .filter((p) => !p.parent_page_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getChildPages = (parentId) => {
    return pages
      .filter((p) => p.parent_page_id === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const PageNode = ({ page, level = 0 }) => {
    const children = getChildPages(page.id);

    return (
      <div>
        <Link
          to={`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${page.id}`}
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 group-hover:text-violet-600">
            {page.title}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        {children.map((child) => (
          <PageNode key={child.id} page={child} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <Card className="p-4 glass-card">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h3>
      <div className="space-y-1">
        {rootPages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No pages yet</p>
        ) : (
          rootPages.map((page) => <PageNode key={page.id} page={page} />)
        )}
      </div>
    </Card>
  );
}
