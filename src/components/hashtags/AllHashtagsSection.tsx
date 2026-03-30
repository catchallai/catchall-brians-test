import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Hash, Star, Copy, Check, Trash2, MoreVertical, Search } from 'lucide-react';
import { CATEGORY_FILTER } from '@/constants/hashtagManager';
import COPY from '@/lib/copy';
import type { HashtagPool } from '@/types/hashtags';

interface AllHashtagsSectionProps {
  selectedCategory: string;
}

const splitCategories = (cat: string | null | undefined): string[] =>
  cat
    ? cat
        .split(' | ')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    : [];

export function AllHashtagsSection({ selectedCategory }: AllHashtagsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingPoolId, setDeletingPoolId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: hashtags = [] } = useQuery<HashtagPool[]>({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.HashtagPool.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HashtagPool> }) =>
      base44.entities.HashtagPool.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const toggleFavorite = (pool: HashtagPool) => {
    updateMutation.mutate({ id: pool.id, data: { is_favorite: !pool.is_favorite } });
  };

  const sectionTitle =
    selectedCategory === CATEGORY_FILTER.ALL
      ? 'All Hashtags'
      : selectedCategory === CATEGORY_FILTER.FAVORITES
        ? 'Favorite Hashtags'
        : selectedCategory === CATEGORY_FILTER.UNCATEGORIZED
          ? 'Uncategorized'
          : `${selectedCategory} Hashtags`;

  const filteredHashtags = hashtags.filter((h) => {
    const matchesSearch =
      !searchQuery || h.hashtag.toLowerCase().includes(searchQuery.toLowerCase());
    const poolCategories = splitCategories(h.category);
    const matchesCategory =
      selectedCategory === CATEGORY_FILTER.ALL ||
      (selectedCategory === CATEGORY_FILTER.FAVORITES && h.is_favorite) ||
      (selectedCategory === CATEGORY_FILTER.UNCATEGORIZED && poolCategories.length === 0) ||
      poolCategories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const copyAll = () => {
    navigator.clipboard.writeText(filteredHashtags.map((h) => `#${h.hashtag}`).join(' '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <>
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>{sectionTitle}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAll}
                className="gap-1.5 h-7 px-2 text-xs"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAll ? 'Copied!' : 'Copy All'}
              </Button>
              <Badge variant="secondary">{filteredHashtags.length} pools</Badge>
            </div>
          </CardTitle>
          {/* Search bar — directly below the section title */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={COPY.hashtagManager.searchPlaceholder}
              className="pl-10 w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredHashtags.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{COPY.hashtagManager.noPoolsFound}</p>
              <p className="text-sm text-gray-400 mt-1">{COPY.hashtagManager.createFirstPool}</p>
            </div>
          ) : (
            <div>
              {filteredHashtags.map((pool) => {
                const displayCategories = pool.category
                  ? pool.category
                      .split(' | ')
                      .map((c) => c.trim())
                      .filter(Boolean)
                  : [];
                return (
                  <div
                    key={pool.id}
                    className="group flex items-start gap-3 px-6 py-4 border-b last:border-b-0"
                  >
                    <button onClick={() => toggleFavorite(pool)} className="mt-0.5 shrink-0">
                      {pool.is_favorite ? (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <Star className="w-4 h-4 text-gray-300 hover:text-amber-400 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-violet-600">{pool.hashtag}</span>
                        {displayCategories.length > 0 && (
                          <span className="text-sm text-gray-400">
                            {displayCategories.join(' | ')}
                          </span>
                        )}
                      </div>
                      {pool.hashtags && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                          {pool.hashtags}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(pool.hashtags || pool.hashtag)
                          }
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingPoolId(pool.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deletingPoolId} onOpenChange={(open) => !open && setDeletingPoolId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hashtag Pool</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            Are you sure you want to delete this hashtag pool? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeletingPoolId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingPoolId) deleteMutation.mutate(deletingPoolId);
                setDeletingPoolId(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
