import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderPlus, Folder, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function FolderManager({ onFolderSelect, currentFolderId }) {
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#8b5cf6');
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ['asset-folders'],
    queryFn: () => base44.entities.AssetFolder.list('-created_date'),
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetFolder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-folders'] });
      setShowNewFolderModal(false);
      setFolderName('');
      toast.success('Folder created');
    },
  });

  const FOLDER_COLORS = [
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Red' },
    { value: '#ec4899', label: 'Pink' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Folders</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowNewFolderModal(true)}>
          <FolderPlus className="w-4 h-4" />
        </Button>
      </div>

      <button
        onClick={() => onFolderSelect(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          !currentFolderId
            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Folder className="w-4 h-4" />
        <span className="text-sm">All Assets</span>
      </button>

      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onFolderSelect(folder.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentFolderId === folder.id
              ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Folder className="w-4 h-4" style={{ color: folder.color }} />
          <span className="text-sm flex-1 text-left">{folder.name}</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </button>
      ))}

      <Dialog open={showNewFolderModal} onOpenChange={setShowNewFolderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Brand Assets, Social Media"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFolderColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      folderColor === color.value
                        ? 'border-gray-900 dark:border-white'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewFolderModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  createFolderMutation.mutate({ name: folderName, color: folderColor })
                }
                disabled={!folderName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
