import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, CheckCircle } from 'lucide-react';

export default function DocumentVersionHistory({ documentId }) {
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      if (!documentId) {
        return [];
      }
      return await base44.entities.DocumentVersion.filter(
        {
          document_id: documentId,
        },
        '-version_number'
      );
    },
    enabled: !!documentId,
  });

  const formatBytes = (bytes) => {
    if (!bytes) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!versions.length) {
    return null;
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Version History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {versions.map((version, idx) => (
            <div
              key={version.id}
              className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-start gap-3 flex-1">
                <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Version {version.version_number}
                    </span>
                    {version.is_current && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{formatBytes(version.file_size)}</p>
                  {version.change_notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {version.change_notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(version.created_date).toLocaleDateString()} by{' '}
                    {version.created_by}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVersion(version)}
                className="gap-1 text-xs flex-shrink-0"
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Download Dialog */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download Version {selectedVersion.version_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">File Name</label>
                <p className="font-medium">{selectedVersion.file_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">File Size</label>
                <p className="font-medium">{formatBytes(selectedVersion.file_size)}</p>
              </div>
              {selectedVersion.change_notes && (
                <div>
                  <label className="text-sm text-gray-600">Changes</label>
                  <p className="text-sm">{selectedVersion.change_notes}</p>
                </div>
              )}
              <Button
                onClick={() => window.open(selectedVersion.file_url, '_blank')}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Download Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
