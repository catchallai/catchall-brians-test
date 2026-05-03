import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * FolderApprovalsManager
 * Manages approval workflows attached to project media folders
 * - Submit items for approval
 * - Track approval status
 * - Associate approvals with specific folder types (drafts, assets, etc)
 */

export default function FolderApprovalsManager({ folder }) {
  const queryClient = useQueryClient();
  const [showNewApproval, setShowNewApproval] = useState(false);

  // Fetch approvals for this folder
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['folder-approvals', folder?.id],
    queryFn: async () => {
      if (!folder?.id) return [];
      return await base44.entities.ApprovalRequest.filter({
        folder_id: folder.id,
      }, '-created_date', 50);
    },
    enabled: !!folder?.id,
  });

  // Create approval request
  const createApprovalMutation = useMutation({
    mutationFn: async (approvalData) => {
      return await base44.entities.ApprovalRequest.create({
        ...approvalData,
        folder_id: folder.id,
        status: 'pending',
        created_by: (await base44.auth.me()).email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-approvals', folder?.id] });
      setShowNewApproval(false);
      toast.success('Approval request created');
    },
    onError: () => toast.error('Failed to create approval request'),
  });

  // Update approval status
  const updateApprovalMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.entities.ApprovalRequest.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-approvals', folder?.id] });
    },
  });

  // Delete approval
  const deleteApprovalMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.ApprovalRequest.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-approvals', folder?.id] });
      toast.success('Approval deleted');
    },
  });

  const statusColors = {
    pending: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    approved: { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    rejected: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-600">
          Approvals for {folder?.folder_type}
        </h3>
        <Button
          size="sm"
          onClick={() => setShowNewApproval(true)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-6">
          No approval requests yet
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.map((approval) => {
            const StatusIcon = statusColors[approval.status]?.icon || Clock;
            return (
              <Card key={approval.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusColors[approval.status]?.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{approval.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        by {approval.created_by}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[approval.status]?.badge}>
                    {approval.status}
                  </Badge>
                </div>

                {/* Action Buttons for Pending */}
                {approval.status === 'pending' && (
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateApprovalMutation.mutate({
                          id: approval.id,
                          status: 'rejected',
                        })
                      }
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateApprovalMutation.mutate({
                          id: approval.id,
                          status: 'approved',
                        })
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                  </div>
                )}

                {/* Delete Button */}
                {(approval.status === 'rejected' || approval.status === 'approved') && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteApprovalMutation.mutate(approval.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Approval Form */}
      {showNewApproval && (
        <Card className="p-4 bg-gray-50 border-dashed">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Item title or description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-violet-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  createApprovalMutation.mutate({ title: e.target.value });
                  e.target.value = '';
                }
              }}
              onBlur={(e) => {
                if (!e.target.value.trim()) {
                  setShowNewApproval(false);
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewApproval(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling?.querySelector('input');
                  if (input?.value.trim()) {
                    createApprovalMutation.mutate({ title: input.value });
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}