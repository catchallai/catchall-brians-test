import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Folder, Archive, Trash2, Copy } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkPageActions({ selectedPages, onClearSelection, folders = [] }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ pageIds, data }) => {
      return Promise.all(pageIds.map((id) => base44.entities.WikiPage.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
      onClearSelection();
      toast.success('Pages updated successfully');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (pageIds) => {
      return Promise.all(pageIds.map((id) => base44.entities.WikiPage.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
      setShowDeleteConfirm(false);
      onClearSelection();
      toast.success('Pages deleted successfully');
    },
  });

  const moveToFolder = (folderId) => {
    bulkUpdateMutation.mutate({
      pageIds: selectedPages.map((p) => p.id),
      data: { folder_id: folderId },
    });
  };

  const archivePages = () => {
    bulkUpdateMutation.mutate({
      pageIds: selectedPages.map((p) => p.id),
      data: { status: 'archived' },
    });
  };

  const deletePages = () => {
    setShowDeleteConfirm(true);
  };

  const duplicatePages = async () => {
    for (const page of selectedPages) {
      await base44.entities.WikiPage.create({
        ...page,
        id: undefined,
        title: `${page.title} (Copy)`,
        created_date: undefined,
        updated_date: undefined,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['space-pages'] });
    onClearSelection();
    toast.success('Pages duplicated successfully');
  };

  if (selectedPages.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedPages.length} selected
        </span>

        <div className="flex gap-2">
          {folders.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Folder className="w-4 h-4" />
                  Move to Folder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {folders.map((folder) => (
                  <DropdownMenuItem key={folder.id} onClick={() => moveToFolder(folder.id)}>
                    <Folder className="w-4 h-4 mr-2" />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="outline" size="sm" onClick={duplicatePages} className="gap-2">
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>

          <Button variant="outline" size="sm" onClick={archivePages} className="gap-2">
            <Archive className="w-4 h-4" />
            Archive
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={deletePages}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Cancel
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          if (!bulkDeleteMutation.isPending) {
            setShowDeleteConfirm(false);
          }
        }}
        onConfirm={() => {
          bulkDeleteMutation.mutate(selectedPages.map((p) => p.id));
        }}
        title={`Delete ${selectedPages.length} pages?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
}
