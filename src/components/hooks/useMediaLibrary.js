import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Manages media library modal state, asset fetching, and selection.
 *
 * @param {(urls: string[]) => void} onApply - Called with the selected asset URLs when the user
 *   confirms. The caller is responsible for updating form state, clearing crop state, etc.
 */
export function useMediaLibrary(onApply) {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaLibrarySearch, setMediaLibrarySearch] = useState('');
  const [selectedLibraryAssets, setSelectedLibraryAssets] = useState(/** @type {string[]} */ ([]));

  const { data: mediaAssets = [], isLoading: isMediaLibraryLoading } = useQuery({
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

  const selectLibraryAsset = (assetUrl) => {
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
