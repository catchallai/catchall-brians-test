import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, FileText } from "lucide-react";
import { format } from 'date-fns';

export default function VersionHistory({ open, onClose, pageId, onRevert }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['wiki-versions', pageId],
    queryFn: async () => {
      const allVersions = await base44.entities.WikiPageVersion.list();
      return allVersions
        .filter(v => v.page_id === pageId)
        .sort((a, b) => b.version_number - a.version_number);
    },
    enabled: !!pageId && open,
  });

  const revertMutation = useMutation({
    mutationFn: async (version) => {
      await onRevert(version);
      queryClient.invalidateQueries({ queryKey: ['wiki-page'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-versions'] });
    },
    onSuccess: () => {
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No version history available</p>
          ) : (
            versions.map((version) => (
              <Card key={version.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">v{version.version_number}</Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(version.created_date), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="text-sm text-gray-600">by {version.edited_by}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {version.title}
                    </h4>
                    {version.change_summary && (
                      <p className="text-sm text-gray-600">{version.change_summary}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revertMutation.mutate(version)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Revert
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Version Preview */}
        {selectedVersion && (
          <Card className="p-4 mt-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold mb-2">{selectedVersion.title}</h3>
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
            />
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}