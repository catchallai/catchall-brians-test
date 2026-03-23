import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, RotateCcw, FileText, GitCompare, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import DiffMatchPatch from 'diff-match-patch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function VersionHistory({ open, onClose, pageId, onRevert }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);
  const [revertVersion, setRevertVersion] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['wiki-versions', pageId],
    queryFn: async () => {
      const allVersions = await base44.entities.WikiPageVersion.list();
      return allVersions
        .filter((v) => v.page_id === pageId)
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
      setRevertVersion(null);
      onClose();
    },
  });

  const generateDiff = (oldText, newText) => {
    const dmp = new DiffMatchPatch();
    const diff = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diff);

    return diff.map((part, index) => {
      const [operation, text] = part;
      if (operation === 0) {
        return (
          <span key={index} className="text-gray-700 dark:text-gray-300">
            {text}
          </span>
        );
      } else if (operation === 1) {
        return (
          <span
            key={index}
            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
          >
            {text}
          </span>
        );
      } else {
        return (
          <span
            key={index}
            className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 line-through"
          >
            {text}
          </span>
        );
      }
    });
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Version History
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="compare">Compare Versions</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="flex-1 overflow-y-auto mt-4 space-y-3">
              {versions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No version history available</p>
              ) : (
                versions.map((version, idx) => (
                  <Card key={version.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono">
                            v{version.version_number}
                          </Badge>
                          {idx === 0 && <Badge className="bg-green-500">Current</Badge>}
                          <span className="text-sm text-gray-500">
                            {format(new Date(version.created_date), 'MMM d, yyyy h:mm a')}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            by {version.edited_by}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {version.title}
                        </h4>
                        {version.change_summary && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-blue-900 dark:text-blue-300">
                              {version.change_summary}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedVersion(selectedVersion?.id === version.id ? null : version)
                          }
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          {selectedVersion?.id === version.id ? 'Hide' : 'Preview'}
                        </Button>
                        {idx !== 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevertVersion(version)}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Version Preview */}
                    {selectedVersion?.id === version.id && (
                      <Card className="p-4 mt-4 bg-gray-50 dark:bg-gray-800 max-h-96 overflow-y-auto">
                        <div
                          className="prose dark:prose-invert max-w-none prose-sm"
                          dangerouslySetInnerHTML={{ __html: version.content }}
                        />
                      </Card>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="compare" className="flex-1 overflow-y-auto mt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Version</label>
                  <select
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    value={compareFrom?.id || ''}
                    onChange={(e) => {
                      const version = versions.find((v) => v.id === e.target.value);
                      setCompareFrom(version);
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version_number} - {format(new Date(v.created_date), 'MMM d, h:mm a')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Version</label>
                  <select
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    value={compareTo?.id || ''}
                    onChange={(e) => {
                      const version = versions.find((v) => v.id === e.target.value);
                      setCompareTo(version);
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version_number} - {format(new Date(v.created_date), 'MMM d, h:mm a')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compareFrom && compareTo ? (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <GitCompare className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold">
                      Comparing v{compareFrom.version_number} → v{compareTo.version_number}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Title Diff */}
                    {compareFrom.title !== compareTo.title && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                          Title Changes
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm">
                          {generateDiff(compareFrom.title, compareTo.title)}
                        </div>
                      </div>
                    )}

                    {/* Content Diff */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Content Changes
                      </label>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {generateDiff(stripHtml(compareFrom.content), stripHtml(compareTo.content))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded"></div>
                        <span>Added</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded"></div>
                        <span>Removed</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <GitCompare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select two versions to compare</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={!!revertVersion} onOpenChange={() => setRevertVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to v{revertVersion?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the page to version {revertVersion?.version_number} created on{' '}
              {revertVersion && format(new Date(revertVersion.created_date), 'MMM d, yyyy h:mm a')}.
              The current version will be saved in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revertVersion && revertMutation.mutate(revertVersion)}
            >
              Revert to This Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
