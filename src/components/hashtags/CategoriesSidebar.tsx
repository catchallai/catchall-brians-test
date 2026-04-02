import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hash, Star, Folder, FolderPlus, Folders } from 'lucide-react';
import { CATEGORY_FILTER } from '@/constants/hashtagManager';
import COPY from '@/lib/copy';
import type { HashtagPool } from '@/types/hashtags';
import { splitCategories, normalizeCategoryName } from '@/utils/hashtags';

interface CategoriesSidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddCategory: (name: string) => void;
  customCategories: string[];
}

export function CategoriesSidebar({
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  customCategories,
}: CategoriesSidebarProps) {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [pendingNewCategory, setPendingNewCategory] = useState('');

  const { data: hashtags = [] } = useQuery<HashtagPool[]>({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const categories = [...new Set(hashtags.flatMap((h) => splitCategories(h.category)))];
  const allCategories = [...new Set([...categories, ...customCategories])];

  const confirmNewCategory = () => {
    const name = normalizeCategoryName(pendingNewCategory);
    if (!name) return;
    onAddCategory(name);
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
  };

  const cancelNewCategory = () => {
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
  };

  return (
    <Card className="shadow-sm rounded-2xl h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Folders className="w-4 h-4 text-white" />
            </div>
            {COPY.hashtagManager.categoriesTitle}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => {
              if (typeof onAddCategory === 'function' && onAddCategory.length === 0) {
                // External handler (e.g., open modal)
                onAddCategory();
              } else {
                setShowNewCategoryInput((v) => !v);
              }
            }}
            aria-label="Add category"
          >
            <FolderPlus className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {showNewCategoryInput && (
          <div className="flex gap-2 pb-2">
            <Input
              value={pendingNewCategory}
              onChange={(e) => setPendingNewCategory(e.target.value)}
              placeholder="New category name..."
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewCategory();
                if (e.key === 'Escape') cancelNewCategory();
              }}
            />
            <Button
              size="sm"
              onClick={confirmNewCategory}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelNewCategory}>
              Cancel
            </Button>
          </div>
        )}
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
