import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const riskColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  scanning: <Clock className="w-4 h-4 animate-spin" />,
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

export default function ComplianceEvidenceList({ complianceItemId }) {
  const queryClient = useQueryClient();

  const { data: evidenceList = [], isLoading } = useQuery({
    queryKey: ['compliance-evidence', complianceItemId],
    queryFn: () =>
      base44.entities.ComplianceEvidence.filter({
        compliance_item_id: complianceItemId,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (evidenceId) => base44.entities.ComplianceEvidence.delete(evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-evidence', complianceItemId] });
    },
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading evidence...</div>;
  }

  if (evidenceList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No evidence files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evidenceList.map((evidence) => (
        <Card key={evidence.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <h4 className="font-medium text-sm truncate">{evidence.file_name}</h4>
                </div>

                {evidence.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{evidence.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {evidence.file_type}
                  </Badge>

                  <div className="flex items-center gap-1">
                    {statusIcons[evidence.scan_status]}
                    <Badge variant="outline" className="text-xs">
                      {evidence.scan_status}
                    </Badge>
                  </div>

                  {evidence.sensitive_info_detected && evidence.scan_results && (
                    <Badge className={`text-xs ${riskColors[evidence.scan_results.risk_level] || 'bg-gray-100'}`}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {evidence.scan_results.risk_level} risk
                    </Badge>
                  )}

                  {evidence.verification_status && (
                    <Badge
                      className={`text-xs ${
                        evidence.verification_status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : evidence.verification_status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {evidence.verification_status === 'pending_review'
                        ? 'Pending Review'
                        : evidence.verification_status}
                    </Badge>
                  )}
                </div>

                {evidence.sensitive_info_detected && evidence.scan_results?.detected_patterns && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                    <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                      Sensitive information detected:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                      {evidence.scan_results.detected_patterns.map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Uploaded by {evidence.uploaded_by} on {new Date(evidence.created_date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(evidence.file_url, '_blank')}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(evidence.id)}
                  disabled={deleteMutation.isPending}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}