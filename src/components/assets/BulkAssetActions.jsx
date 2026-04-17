import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Folder, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BulkAssetActions({ selectedAssets, onClear, onComplete }) {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetFolder, setTargetFolder] = useState('');

  const { data: folders = [] } = useQuery({
    queryKey: ['asset-folders'],
    queryFn: () => base44.entities.AssetFolder.list(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['media-assets'],
    queryFn: () => base44.entities.MediaAsset.list('-created_date'),
  });

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedAssets.length} assets?`)) {
      return;
    }

    for (const id of selectedAssets) {
      await base44.entities.MediaAsset.delete(id);
    }
    toast.success('Assets deleted');
    onComplete();
  };

  const handleBulkMove = async () => {
    for (const id of selectedAssets) {
      await base44.entities.MediaAsset.update(id, { folder_id: targetFolder || null });
    }
    toast.success('Assets moved');
    setShowMoveModal(false);
    onComplete();
  };

  const handleBulkDownload = async () => {
    const selectedAssetData = assets.filter((a) => selectedAssets.includes(a.id));
    for (const asset of selectedAssetData) {
      const a = document.createElement('a');
      a.href = asset.file_url;
      a.download = asset.name;
      a.click();
    }
    toast.success('Downloads started');
  };

  if (selectedAssets.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border p-4 flex items-center gap-3 z-50">
        <span className="text-sm font-medium">{selectedAssets.length} selected</span>
        <div className="h-6 w-px bg-gray-200" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMoveModal(true)}
          className="gap-2"
        >
          <Folder className="w-4 h-4" />
          Move
        </Button>
        <Button variant="outline" size="sm" onClick={handleBulkDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDelete}
          className="gap-2 text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Cancel
        </Button>
      </div>

      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedAssets.length} Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={targetFolder} onValueChange={setTargetFolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Root (No folder)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMoveModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkMove}>Move</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
