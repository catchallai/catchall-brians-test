import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export interface MediaAsset {
  id: string;
  name?: string;
  file_url?: string;
  file_type?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

export interface UseMediaLibraryResult {
  isMediaLibraryOpen: boolean;
  setIsMediaLibraryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mediaLibrarySearch: string;
  setMediaLibrarySearch: React.Dispatch<React.SetStateAction<string>>;
  selectedLibraryAssets: string[];
  imageAssets: MediaAsset[];
  isMediaLibraryLoading: boolean;
  openMediaLibrary: () => void;
  resetMediaLibrary: () => void;
  selectLibraryAsset: (assetUrl: string) => void;
  applySelectedLibraryAssets: () => void;
}

/**
 * Manages media library modal state, asset fetching, and selection.
 *
 * @param onApply - Called with the selected asset URLs when the user confirms.
 */
export function useMediaLibrary(onApply: (urls: string[]) => void): UseMediaLibraryResult {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaLibrarySearch, setMediaLibrarySearch] = useState('');
  const [selectedLibraryAssets, setSelectedLibraryAssets] = useState<string[]>([]);

  const { data: mediaAssets = [], isLoading: isMediaLibraryLoading } = useQuery<MediaAsset[]>({
    queryKey: ['media-assets'],
    queryFn: () => base44.entities.MediaAsset.list('-created_date', 500),
    enabled: isMediaLibraryOpen,
    staleTime: 5 * 60 * 1000,
  });

  const imageAssets = mediaAssets.filter((asset) => {
    if (asset.file_type && asset.file_type !== 'image') return false;
    if (!asset.file_url) return false;
    return (
      !mediaLibrarySearch ||
      asset.name?.toLowerCase().includes(mediaLibrarySearch.toLowerCase()) ||
      asset.category?.toLowerCase().includes(mediaLibrarySearch.toLowerCase()) ||
      asset.tags?.some((tag) => tag.toLowerCase().includes(mediaLibrarySearch.toLowerCase()))
    );
  });

  const openMediaLibrary = () => {
    setMediaLibrarySearch('');
    setSelectedLibraryAssets([]);
    setIsMediaLibraryOpen(true);
  };

  const resetMediaLibrary = () => {
    setIsMediaLibraryOpen(false);
    setMediaLibrarySearch('');
    setSelectedLibraryAssets([]);
  };

  const selectLibraryAsset = (assetUrl: string) => {
    setSelectedLibraryAssets((current) =>
      current.includes(assetUrl)
        ? current.filter((url) => url !== assetUrl)
        : [...current, assetUrl]
    );
  };

  const applySelectedLibraryAssets = () => {
    if (selectedLibraryAssets.length === 0) return;
    onApply(selectedLibraryAssets);
    setSelectedLibraryAssets([]);
    setIsMediaLibraryOpen(false);
  };

  return {
    isMediaLibraryOpen,
    setIsMediaLibraryOpen,
    mediaLibrarySearch,
    setMediaLibrarySearch,
    selectedLibraryAssets,
    imageAssets,
    isMediaLibraryLoading,
    openMediaLibrary,
    resetMediaLibrary,
    selectLibraryAsset,
    applySelectedLibraryAssets,
  };
}
