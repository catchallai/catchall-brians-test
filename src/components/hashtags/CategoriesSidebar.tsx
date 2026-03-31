import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Star, Folder, FolderPlus } from 'lucide-react';
import { CATEGORY_FILTER } from '@/constants/hashtagManager';
import COPY from '@/lib/copy';
import type { HashtagPool } from '@/types/hashtags';
import { splitCategories } from '@/utils/hashtags';

interface CategoriesSidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddCategory: () => void;
  customCategories: string[];
}

export function CategoriesSidebar({
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  customCategories,
}: CategoriesSidebarProps) {
  const { data: hashtags = [] } = useQuery<HashtagPool[]>({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const categories = [...new Set(hashtags.flatMap((h) => splitCategories(h.category)))];
  const allCategories = [...new Set([...categories, ...customCategories])];

  return (
    <Card className="border-0 shadow-sm rounded-2xl h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          {COPY.hashtagManager.categoriesTitle}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAddCategory}
            aria-label="Add category"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <button
          onClick={() => onSelectCategory(CATEGORY_FILTER.ALL)}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
            selectedCategory === CATEGORY_FILTER.ALL
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            {COPY.hashtagManager.allHashtags}
          </span>
          <Badge variant="secondary" className="text-xs">
            {hashtags.length}
          </Badge>
        </button>

        <button
          onClick={() => onSelectCategory(CATEGORY_FILTER.FAVORITES)}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
            selectedCategory === CATEGORY_FILTER.FAVORITES
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            {COPY.hashtagManager.favorites}
          </span>
          <Badge variant="secondary" className="text-xs">
            {hashtags.filter((h) => h.is_favorite).length}
          </Badge>
        </button>

        <div className="border-t my-3" />

        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors capitalize ${
              selectedCategory === cat
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              {cat}
            </span>
            <Badge variant="secondary" className="text-xs">
              {hashtags.filter((h) => splitCategories(h.category).includes(cat)).length}
            </Badge>
          </button>
        ))}

        <button
          onClick={() => onSelectCategory(CATEGORY_FILTER.UNCATEGORIZED)}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
            selectedCategory === CATEGORY_FILTER.UNCATEGORIZED
              ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          <span className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            {COPY.hashtagManager.uncategorized}
          </span>
          <Badge variant="secondary" className="text-xs">
            {hashtags.filter((h) => !h.category).length}
          </Badge>
        </button>
      </CardContent>
    </Card>
  );
}
