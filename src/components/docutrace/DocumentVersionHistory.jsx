import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Clock, Download, Eye, RotateCcw, User, CheckCircle2 } from 'lucide-react';

export default function DocumentVersionHistory({ open, onClose, document }) {
  const [revertVersion, setRevertVersion] = useState(null);
  const queryClient = useQueryClient();

  const versions = document?.versions || [];
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  const revertMutation = useMutation({
    mutationFn: async (version) => {
      const newVersionNumber = (document.versions?.length || 0) + 1;

      // Create new version entry with the old file
      const newVersion = {
        version_number: newVersionNumber,
        file_url: version.file_url,
        uploaded_at: new Date().toISOString(),
        uploaded_by: (await base44.auth.me()).email,
        changes_description: `Reverted to version ${version.version_number}`,
      };

      return await base44.entities.TrackedDocument.update(document.id, {
        file_url: version.file_url,
        versions: [...document.versions, newVersion],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-documents'] });
      setRevertVersion(null);
      toast.success('Document reverted successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to revert document');
    },
  });

  const handleDownload = (version) => {
    const link = document.createElement('a');
    link.href = version.file_url;
    link.download = `${document.name}_v${version.version_number}`;
    link.click();
  };

  const handleView = (version) => {
    window.open(version.file_url, '_blank');
  };

  const isCurrentVersion = (version) => {
    return version.file_url === document?.file_url;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Version History - {document?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {sortedVersions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No version history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedVersions.map((version, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${
                      isCurrentVersion(version)
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Version {version.version_number}</h4>
                          {isCurrentVersion(version) && (
                            <Badge className="bg-violet-100 text-violet-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {version.uploaded_by || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(version.uploaded_at).toLocaleString()}
                          </div>
                          {version.changes_description && (
                            <p className="mt-2 text-gray-700 dark:text-gray-300">
                              {version.changes_description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(version)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(version)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {!isCurrentVersion(version) && (
                          <Button size="sm" onClick={() => setRevertVersion(version)}>
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revertVersion}
        onClose={() => setRevertVersion(null)}
        onConfirm={() => revertMutation.mutate(revertVersion)}
        title="Revert to Previous Version"
        description={`This will create a new version using the file from version ${revertVersion?.version_number}. The current version will be preserved in history.`}
        confirmLabel="Revert"
        isLoading={revertMutation.isPending}
      />
    </>
  );
}
