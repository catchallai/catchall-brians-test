import { useState, type ReactElement } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, ChevronDown, Star } from 'lucide-react';
import { toast } from 'sonner';
import COPY from '@/lib/copy';
import type { HashtagPool } from '@/types/hashtags';
import {
  normalizeCategoryName,
  normalizeHashtagInput,
  splitCategories,
  toggleArrayItem,
} from '@/utils/hashtags';

interface HashtagPoolCreatePopoverProps {
  /** Rendered as PopoverTrigger asChild — must be a single React element */
  trigger: ReactElement;
  /** Pass dialogContentRef.current when used inside a Dialog to avoid z-index issues */
  container?: HTMLElement | null;
  /** Forward to PopoverContent to prevent accidental close (e.g. caption focus guard) */
  onFocusOutside?: (event: Event) => void;
}

export function HashtagPoolCreatePopover({
  trigger,
  container,
  onFocusOutside,
}: HashtagPoolCreatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [poolHashtags, setPoolHashtags] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [pendingNewCategory, setPendingNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: pools = [] } = useQuery<HashtagPool[]>({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<HashtagPool, 'id'>) => base44.entities.HashtagPool.create(data),
    onError: () => toast.error(COPY.hashtagManager.createPoolError),
    onSuccess: (createdPool: HashtagPool) => {
      // Optimistically prepend so the new pool is immediately visible regardless
      // of sort/limit in parent page queries (e.g. list('-usage_count', 50)).
      queryClient.setQueryData<HashtagPool[]>(['hashtag-pool'], (old = []) => [
        createdPool,
        ...old,
      ]);
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setPoolName('');
      setPoolHashtags('');
      setCategories([]);
      setIsFavorite(false);
      setShowNewCategoryInput(false);
      setPendingNewCategory('');
      setLocalCategories([]);
      setOpen(false);
    },
  });

  const existingCategories = [...new Set(pools.flatMap((p) => splitCategories(p.category)))];
  const allCategories = [...new Set([...existingCategories, ...localCategories])];

  const toggleCategory = (cat: string) => {
    setCategories((prev) => toggleArrayItem(prev, cat));
  };

  const confirmNewCategory = () => {
    const name = normalizeCategoryName(pendingNewCategory);
    if (!name) return;
    setLocalCategories((prev) => [...new Set([...prev, name])]);
    setCategories((prev) => [...new Set([...prev, name])]);
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
  };

  const handleAdd = () => {
    if (!poolName.trim() || !poolHashtags.trim()) return;
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
    mutation.mutate({
      hashtag: poolName.trim().replace(/^#+/, ''),
      category: categories.join(' | ') || null,
      hashtags: normalizeHashtagInput(poolHashtags),
      is_favorite: isFavorite,
      usage_count: 0,
    });
  };

  const hasSelections = isFavorite || categories.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        container={container}
        align="start"
        side="top"
        className="w-80 p-3"
        onFocusOutside={onFocusOutside}
      >
        <p className="text-sm font-semibold mb-3">{COPY.hashtagManager.createPoolTitle}</p>

        {/* Name + Category row */}
        <div className="flex gap-2 mb-2">
          <div className="flex-[3]">
            <Input
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              placeholder={COPY.hashtagManager.poolNamePlaceholder}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-[2]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm">
                  {!hasSelections ? (
                    <span className="text-muted-foreground text-xs truncate">Category...</span>
                  ) : (
                    <span className="flex items-center gap-0.5 min-w-0 overflow-hidden">
                      {isFavorite && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1 py-0.5 rounded shrink-0">
                          ★
                        </span>
                      )}
                      {categories.length === 1 && (
                        <span className="bg-violet-100 text-violet-700 text-xs px-1 py-0.5 rounded capitalize truncate">
                          {categories[0]}
                        </span>
                      )}
                      {categories.length > 1 && (
                        <span className="bg-violet-100 text-violet-700 text-xs px-1 py-0.5 rounded shrink-0">
                          {isFavorite ? `+${categories.length}` : `${categories.length} cats`}
                        </span>
                      )}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-1" />
                </button>
              </PopoverTrigger>
              <PopoverContent container={container} className="w-48 p-1" align="start">
                {/* Favorites */}
                <button
                  onClick={() => setIsFavorite((prev) => !prev)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      isFavorite ? 'bg-amber-500 border-amber-500 text-white' : 'border-input'
                    }`}
                  >
                    {isFavorite && <Check className="h-3 w-3" />}
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
                        categories.includes(cat)
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-input'
                      }`}
                    >
                      {categories.includes(cat) && <Check className="h-3 w-3" />}
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

        {/* New category inline input */}
        {showNewCategoryInput && (
          <div className="flex gap-1.5 mb-2">
            <Input
              value={pendingNewCategory}
              onChange={(e) => setPendingNewCategory(e.target.value)}
              placeholder={COPY.hashtagManager.newCategoryPlaceholder}
              className="flex-1 h-8 text-sm"
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
              className="h-8 bg-violet-600 hover:bg-violet-700"
            >
              {COPY.hashtagManager.newCategoryAdd}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setShowNewCategoryInput(false);
                setPendingNewCategory('');
              }}
            >
              {COPY.hashtagManager.newCategoryCancel}
            </Button>
          </div>
        )}

        {/* Hashtags textarea */}
        <Textarea
          value={poolHashtags}
          onChange={(e) => setPoolHashtags(e.target.value)}
          placeholder={COPY.hashtagManager.hashtagsPlaceholder}
          rows={3}
          className="text-sm mb-2"
        />

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleAdd}
            disabled={!poolName.trim() || !poolHashtags.trim() || mutation.isPending}
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-3.5 h-3.5" />
            {COPY.hashtagManager.addPool}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
