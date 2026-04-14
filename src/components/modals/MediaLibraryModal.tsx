import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Images, Search, Check } from 'lucide-react';
import { MAX_POST_IMAGE_COUNT } from '@/utils/postMedia';
import COPY from '@/lib/copy';

interface ImageAsset {
  id: string;
  file_url: string;
  name?: string;
  category?: string;
  file_type?: string;
}

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  imageAssets: ImageAsset[];
  selectedAssetUrls: string[];
  existingImageCount: number;
  onSelectAsset: (url: string) => void;
  onApply: () => void;
}

export default function MediaLibraryModal({
  open,
  onOpenChange,
  searchValue,
  onSearchChange,
  isLoading,
  imageAssets,
  selectedAssetUrls,
  existingImageCount,
  onSelectAsset,
  onApply,
}: MediaLibraryModalProps) {
  const remainingSlots = MAX_POST_IMAGE_COUNT - existingImageCount;
  const selectedCount = selectedAssetUrls.length;
  const isAtSelectionLimit = selectedCount >= remainingSlots;

  const getImageLabel = (count: number) => `Image${count !== 1 ? 's' : ''}`;
  const getApplyLabel = (count: number) =>
    count === 0 ? `Add ${getImageLabel(count)}` : `Add ${count} ${getImageLabel(count)}`;
  const getDescription = (slots: number) =>
    slots <= 0
      ? `You have reached the ${MAX_POST_IMAGE_COUNT}-${MAX_POST_IMAGE_COUNT === 1 ? 'image' : 'images'} limit for this post.`
      : `Select up to ${slots} image${slots !== 1 ? 's' : ''} to add to this post.`;

  const applyLabel = getApplyLabel(selectedCount);
  const description = getDescription(remainingSlots);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="w-5 h-5 text-violet-600" />
            {COPY.mediaLibraryModal.title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={COPY.mediaLibraryModal.searchPlaceholder}
              className="pl-9 focus-visible:border-violet-300 focus-visible:ring-violet-400"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {COPY.mediaLibraryModal.loading}
              </div>
            ) : imageAssets.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">
                {COPY.mediaLibraryModal.empty}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {imageAssets.map((asset) => {
                  const isSelected = selectedAssetUrls.includes(asset.file_url);
                  const isDisabled = !isSelected && isAtSelectionLimit;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => !isDisabled && onSelectAsset(asset.file_url)}
                      disabled={isDisabled}
                      className={`overflow-hidden rounded-xl border bg-white text-left transition-all ${
                        isSelected
                          ? 'border-violet-500 ring-2 ring-violet-200'
                          : isDisabled
                            ? 'cursor-not-allowed border-gray-200 opacity-40'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={asset.file_url}
                          alt={asset.name || 'Media asset'}
                          className="h-full w-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {asset.name || 'Untitled image'}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {asset.category || asset.file_type || 'Image'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="items-center justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {COPY.mediaLibraryModal.cancel}
          </Button>
          <Button
            onClick={onApply}
            disabled={selectedCount === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
