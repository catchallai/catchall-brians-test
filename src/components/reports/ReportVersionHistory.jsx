import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { History, RotateCcw, Eye, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ReportVersionHistory({ report, open, onClose, onRevert }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [revertConfirm, setRevertConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['report-versions', report?.id],
    queryFn: () =>
      base44.entities.ReportVersion.filter({ report_id: report.id }, '-version_number', 50),
    enabled: !!report?.id,
  });

  const revertMutation = useMutation({
    mutationFn: async (version) => {
      // Update report with version data
      await base44.entities.SEOReport.update(report.id, {
        report_data: version.report_data,
        metrics: version.metrics,
      });

      // Create audit log
      await base44.entities.ReportAuditLog.create({
        report_id: report.id,
        action: 'version_reverted',
        user_email: (await base44.auth.me()).email,
        details: {
          reverted_to_version: version.version_number,
          timestamp: new Date().toISOString(),
        },
      });

      return version;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-versions'] });
      onRevert?.();
      onClose();
    },
  });

  const handleRevert = (version) => {
    setRevertConfirm(version);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History - {report?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No version history available yet</p>
              <p className="text-sm">Versions will be saved when you regenerate this report</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, idx) => (
                <Card
                  key={version.id}
                  className={`transition-all ${
                    selectedVersion?.id === version.id
                      ? 'ring-2 ring-violet-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={idx === 0 ? 'default' : 'outline'}>
                            Version {version.version_number}
                          </Badge>
                          {idx === 0 && <Badge variant="secondary">Current</Badge>}
                          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(version.created_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>

                        {version.change_summary && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {version.change_summary}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.generated_by || version.created_by}
                          </span>
                          {version.metrics && <span>{version.metrics.length} metrics</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVersion(version)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {idx !== 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevert(version)}
                            disabled={revertMutation.isPending}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedVersion?.id === version.id && version.report_data && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                            Report Data
                          </h4>
                          {version.report_data.summary && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Summary:
                              </span>
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {version.report_data.summary}
                              </p>
                            </div>
                          )}
                          {version.report_data.score && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Score:
                              </span>
                              <Badge variant="secondary">{version.report_data.score}/100</Badge>
                            </div>
                          )}
                          {version.report_data.recommendations && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Recommendations:
                              </span>
                              <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
                                {version.report_data.recommendations.slice(0, 3).map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      <ConfirmDialog
        open={!!revertConfirm}
        onClose={() => setRevertConfirm(null)}
        onConfirm={() => {
          revertMutation.mutate(revertConfirm);
          setRevertConfirm(null);
        }}
        title={`Revert to version ${revertConfirm?.version_number}?`}
        description="This will create a new version with the old data."
        confirmLabel="Revert"
        variant="default"
        isLoading={revertMutation.isPending}
      />
    </Dialog>
  );
}
