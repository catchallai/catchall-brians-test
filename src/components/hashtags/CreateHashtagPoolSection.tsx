import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Check, ChevronDown, Star } from 'lucide-react';
import COPY from '@/lib/copy';
import type { HashtagPool } from '@/types/hashtags';
import {
  normalizeCategoryName,
  normalizeHashtagInput,
  splitCategories,
  toggleArrayItem,
} from '@/utils/hashtags';

interface CreateHashtagPoolSectionProps {
  customCategories: string[];
  onNewCategoryAdded: (cat: string) => void;
}

export function CreateHashtagPoolSection({
  customCategories,
  onNewCategoryAdded,
}: CreateHashtagPoolSectionProps) {
  const [newHashtag, setNewHashtag] = useState('');
  const [newPoolHashtags, setNewPoolHashtags] = useState('');
  const [newPoolCategories, setNewPoolCategories] = useState<string[]>([]);
  const [newPoolIsFavorite, setNewPoolIsFavorite] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [pendingNewCategory, setPendingNewCategory] = useState('');
  const queryClient = useQueryClient();

  const { data: hashtags = [] } = useQuery<HashtagPool[]>({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<HashtagPool, 'id'>) => base44.entities.HashtagPool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setNewHashtag('');
      setNewPoolHashtags('');
      setNewPoolCategories([]);
      setNewPoolIsFavorite(false);
    },
  });

  const categories = [...new Set(hashtags.flatMap((h) => splitCategories(h.category)))];
  const allCategories = [...new Set([...categories, ...customCategories])];

  const toggleCategory = (cat: string) => {
    setNewPoolCategories((prev) => toggleArrayItem(prev, cat));
  };

  const confirmNewCategory = () => {
    const name = normalizeCategoryName(pendingNewCategory);
    if (!name) return;
    onNewCategoryAdded(name);
    setNewPoolCategories((prev) => [...new Set([...prev, name])]);
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
  };

  const handleAdd = () => {
    if (!newHashtag.trim() || !newPoolHashtags.trim()) return;
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
    addMutation.mutate({
      hashtag: newHashtag.trim().replace(/^#+/, ''),
      category: newPoolCategories.join(' | ') || null,
      hashtags: normalizeHashtagInput(newPoolHashtags),
      is_favorite: newPoolIsFavorite,
      usage_count: 0,
    });
  };

  const hasSelections = newPoolIsFavorite || newPoolCategories.length > 0;

  return (
    <Card className="shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          {COPY.hashtagManager.createPoolTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-[3]">
            <Input
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              placeholder="Hashtag pool name..."
            />
          </div>
          <div className="flex-[2]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                  {!hasSelections ? (
                    <span className="text-muted-foreground">Add to category...</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {newPoolIsFavorite && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded">
                          ★ Favorites
                        </span>
                      )}
                      {newPoolCategories.map((cat) => (
                        <span
                          key={cat}
                          className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded capitalize"
                        >
                          {cat}
                        </span>
                      ))}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                {/* Add to Favorites — first option, styled consistently with category items */}
                <button
                  onClick={() => setNewPoolIsFavorite((prev) => !prev)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      newPoolIsFavorite
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-input'
                    }`}
                  >
                    {newPoolIsFavorite && <Check className="h-3 w-3" />}
                  </span>
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {COPY.hashtagManager.addToFavorites}
                </button>

                {allCategories.length > 0 && <div className="border-t my-1" />}

                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent capitalize"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        newPoolCategories.includes(cat)
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-input'
                      }`}
                    >
                      {newPoolCategories.includes(cat) && <Check className="h-3 w-3" />}
                    </span>
                    {cat}
                  </button>
                ))}

                <div className="border-t mt-1 pt-1">
                  <button
                    onClick={() => setShowNewCategoryInput(true)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-violet-600 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    {COPY.hashtagManager.newCategory}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {showNewCategoryInput && (
          <div className="flex gap-2">
            <Input
              value={pendingNewCategory}
              onChange={(e) => setPendingNewCategory(e.target.value)}
              placeholder="New category name..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewCategory();
                if (e.key === 'Escape') {
                  setShowNewCategoryInput(false);
                  setPendingNewCategory('');
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={confirmNewCategory}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewCategoryInput(false);
                setPendingNewCategory('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        <Textarea
          value={newPoolHashtags}
          onChange={(e) => setNewPoolHashtags(e.target.value)}
          placeholder={COPY.hashtagManager.hashtagsPlaceholder}
          rows={4}
        />

        <div className="flex items-center justify-end">
          <Button
            onClick={handleAdd}
            disabled={!newHashtag.trim() || !newPoolHashtags.trim() || addMutation.isPending}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            {COPY.hashtagManager.addPool}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
