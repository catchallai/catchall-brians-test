import { useState, useEffect } from 'react';
import { Star, MoreVertical, Copy, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import COPY from '@/lib/copy';

const SELECTOR_COPY = COPY.createPost.hashtagPoolSelector;

export interface HashtagPool {
  id: string;
  /** Pool display name */
  hashtag: string;
  /** Space-separated hashtag string, e.g. "#tag1 #tag2" */
  hashtags: string;
  /** Pipe-separated categories, e.g. "Brand | Campaign" */
  category?: string;
  is_favorite: boolean;
  usage_count?: number;
}

interface HashtagPoolSelectorProps {
  pools: HashtagPool[];
  toggledPoolIds: Set<string>;
  onToggle: (pool: HashtagPool) => void;
}

export default function HashtagPoolSelector({
  pools,
  toggledPoolIds,
  onToggle,
}: HashtagPoolSelectorProps) {
  const [orderedPools, setOrderedPools] = useState<HashtagPool[]>(pools);
  const queryClient = useQueryClient();

  // Re-sync when the pool list changes (after a delete or external refresh).
  useEffect(() => {
    setOrderedPools((prev) => {
      // Keep the existing order but add new pools at the end and drop deleted ones.
      const existingIds = new Set(prev.map((p) => p.id));
      const incomingIds = new Set(pools.map((p) => p.id));

      const kept = prev
        .filter((p) => incomingIds.has(p.id))
        .map((p) => pools.find((incoming) => incoming.id === p.id) ?? p);

      const added = pools.filter((p) => !existingIds.has(p.id));
      return [...kept, ...added];
    });
  }, [pools]);

  const favoriteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HashtagPool> }) =>
      base44.entities.HashtagPool.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.HashtagPool.delete(id),
    onSuccess: (_data, id) => {
      setOrderedPools((prev) => prev.filter((p) => p.id !== id));
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
    },
    onError: () => toast.error(SELECTOR_COPY.toasts.error.delete),
  });

  // ── Carousel helpers ──────────────────────────────────────────────────────

  const bringToFront = (index: number) => {
    if (index === 0) return;
    setOrderedPools((prev) => [...prev.slice(index), ...prev.slice(0, index)]);
  };

  const rotateLeft = () => {
    setOrderedPools((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));
  };

  const rotateRight = () => {
    setOrderedPools((prev) =>
      prev.length > 1 ? [prev[prev.length - 1], ...prev.slice(0, -1)] : prev
    );
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePillClick = (pool: HashtagPool, index: number) => {
    bringToFront(index);
    onToggle(pool);
  };

  const handleFavoriteClick = (pool: HashtagPool) => {
    favoriteMutation.mutate({ id: pool.id, data: { is_favorite: !pool.is_favorite } });
  };

  const handleCopy = async (pool: HashtagPool) => {
    try {
      await navigator.clipboard.writeText(pool.hashtags ?? '');
      toast.success(SELECTOR_COPY.toasts.success.copy);
    } catch {
      toast.error(SELECTOR_COPY.toasts.error.copy);
    }
  };

  const handleDelete = (pool: HashtagPool) => {
    deleteMutation.mutate(pool.id);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (orderedPools.length === 0) return null;

  const activePool = orderedPools[0];
  const categories = activePool.category?.trim() ?? '';

  return (
    <div className="px-6 pb-2">
      {/* Pill carousel row */}
      <div className="flex items-center gap-1">
        <button
          onClick={rotateRight}
          className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Previous hashtag pool"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-1.5 overflow-hidden flex-1">
          {orderedPools.map((pool, i) => {
            const isActive = i === 0;
            const isToggled = toggledPoolIds.has(pool.id);
            return (
              <button
                key={pool.id}
                onClick={() => handlePillClick(pool, i)}
                className={[
                  'shrink-0 inline-flex items-center text-xs px-3 py-1 rounded-full border transition-colors font-medium',
                  isActive
                    ? isToggled
                      ? 'bg-violet-600 border-violet-600 text-white font-bold'
                      : 'bg-gray-100 border-gray-100 text-gray-500'
                    : isToggled
                      ? 'border-violet-500 text-violet-600 bg-white'
                      : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300',
                ].join(' ')}
              >
                {isToggled && <Check className="mr-1 h-3 w-3" />}
                {pool.hashtag}
              </button>
            );
          })}
        </div>

        <button
          onClick={rotateLeft}
          className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Next hashtag pool"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active pool detail */}
      <div className="mt-1.5 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => handleFavoriteClick(activePool)}
              className="shrink-0 text-gray-300 hover:text-amber-400 transition-colors"
              aria-label={activePool.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star
                className={`w-3.5 h-3.5 ${activePool.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`}
              />
            </button>
            {categories && <span className="text-xs text-gray-400 truncate">{categories}</span>}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Hashtag pool actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCopy(activePool)}>
                <Copy className="w-4 h-4 mr-2" />
                {SELECTOR_COPY.copy}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(activePool)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                {SELECTOR_COPY.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {activePool.hashtags && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{activePool.hashtags}</p>
        )}
      </div>
    </div>
  );
}
