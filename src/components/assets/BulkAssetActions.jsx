import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FolderInput, Tag, Download, X } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/toast-provider';

export default function BulkAssetActions({ selectedAssets, onClear, onComplete }) {
  const toast = useToast();

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedAssets.length} assets?`)) return;
    
    for (const id of selectedAssets) {
      await base44.entities.MediaAsset.delete(id);
    }
    toast.success(`Deleted ${selectedAssets.length} assets`);
    onComplete();
  };

  const handleBulkDownload = async () => {
    const assets = await Promise.all(
      selectedAssets.map(id => base44.entities.MediaAsset.filter({ id }))
    );
    
    assets.flat().forEach(asset => {
      const link = document.createElement('a');
      link.href = asset.file_url;
      link.download = asset.name;
      link.click();
    });
    
    toast.success('Download started');
  };

  if (selectedAssets.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 border-2 border-violet-500 z-50">
      <Badge variant="secondary">{selectedAssets.length} selected</Badge>
      
      <div className="h-6 w-px bg-gray-300" />
      
      <Button variant="ghost" size="sm" onClick={handleBulkDownload}>
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
      
      <Button variant="ghost" size="sm">
        <FolderInput className="w-4 h-4 mr-2" />
        Move
      </Button>
      
      <Button variant="ghost" size="sm">
        <Tag className="w-4 h-4 mr-2" />
        Tag
      </Button>
      
      <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-600">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
      
      <div className="h-6 w-px bg-gray-300" />
      
      <Button variant="ghost" size="icon" onClick={onClear}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}