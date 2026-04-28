import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, FolderPlus, Image, Video, Film, HardDrive, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FolderContentModal from './FolderContentModal';

const FOLDER_TYPES = [
  { type: 'RAW', icon: Image, color: 'bg-blue-500', description: 'Raw photo files' },
  {
    type: 'Unedited Videos',
    icon: Film,
    color: 'bg-purple-500',
    description: 'Unedited video footage',
  },
  { type: 'Edited Photos', icon: Image, color: 'bg-green-500', description: 'Final edited photos' },
  { type: 'Edited Videos', icon: Video, color: 'bg-red-500', description: 'Final edited videos' },
];

export default function MediaFolderManager() {
  const [customFolderName, setCustomFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ['media-folders'],
    queryFn: () => base44.entities.MediaFolder.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaFolder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      setCustomFolderName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaFolder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media-folders'] }),
  });

  const createDefaultFolder = (folderType) => {
    const folderConfig = FOLDER_TYPES.find((f) => f.type === folderType);
    createMutation.mutate({
      name: folderType,
      folder_type: folderType,
      color: folderConfig?.color || 'bg-gray-500',
      description: folderConfig?.description || '',
    });
  };

  const createCustomFolder = () => {
    if (!customFolderName.trim()) {
      return;
    }
    createMutation.mutate({
      name: customFolderName,
      folder_type: 'Custom',
      color: 'bg-violet-500',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) {
      return '0 KB';
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const groupedFolders = FOLDER_TYPES.map((type) => ({
    ...type,
    folders: folders.filter((f) => f.folder_type === type.type),
  }));

  const customFolders = folders.filter((f) => f.folder_type === 'Custom');

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Media Folders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Folder Types */}
        {groupedFolders.map(({ type, icon: Icon, color, description, folders: typeFolders }) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`${color} w-8 h-8 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{type}</h3>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </div>
              {typeFolders.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createDefaultFolder(type)}
                  disabled={createMutation.isPending}
                >
                  <FolderPlus className="w-3 h-3 mr-1" />
                  Create
                </Button>
              )}
            </div>

            {typeFolders.length > 0 && (
              <div className="pl-10 space-y-2">
                {typeFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {folder.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {folder.file_count || 0} files • {formatSize(folder.total_size)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(folder.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Custom Folders */}
        {customFolders.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Custom Folders</h3>
            <div className="space-y-2">
              {customFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setSelectedFolder(folder)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`${folder.color || 'bg-violet-500'} w-8 h-8 rounded-lg flex items-center justify-center`}
                    >
                      <Folder className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {folder.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {folder.file_count || 0} files • {formatSize(folder.total_size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(folder.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Custom Folder */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Custom folder name..."
              value={customFolderName}
              onChange={(e) => setCustomFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createCustomFolder();
                }
              }}
            />
            <Button
              onClick={createCustomFolder}
              disabled={!customFolderName.trim() || createMutation.isPending}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Add Folder
            </Button>
          </div>
        </div>

        {/* Storage Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <HardDrive className="w-4 h-4" />
              <span>Total Storage</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatSize(folders.reduce((sum, f) => sum + (f.total_size || 0), 0))}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Folder Content Modal */}
      <FolderContentModal
        folder={selectedFolder}
        open={!!selectedFolder}
        onClose={() => setSelectedFolder(null)}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        title="Delete this folder?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </Card>
  );
}
