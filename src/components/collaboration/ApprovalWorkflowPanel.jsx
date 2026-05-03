import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, AlertCircle, Plus, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  changes_requested: "bg-orange-100 text-orange-700",
};

const STATUS_ICONS = {
  pending: Clock,
  in_review: Eye,
  approved: CheckCircle,
  rejected: AlertCircle,
  changes_requested: MessageSquare,
};

export default function ApprovalWorkflowPanel({ projectId, mediaAssetIds = [] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [newApproval, setNewApproval] = useState({
    title: "",
    description: "",
    type: "media",
    priority: "medium",
  });

  const queryClient = useQueryClient();

  const { data: approvals = [] } = useQuery({
    queryKey: ["approval-requests", projectId],
    queryFn: () =>
      projectId
        ? base44.entities.ApprovalRequest.filter({ project_id: projectId })
        : Promise.resolve([]),
    enabled: !!projectId,
  });

  const createApprovalMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ApprovalRequest.create({
        ...data,
        project_id: projectId,
        media_asset_ids: mediaAssetIds,
        submitted_by: "current_user",
        status: "pending",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests", projectId] });
      setIsCreateOpen(false);
      setNewApproval({ title: "", description: "", type: "media", priority: "medium" });
      toast.success("Approval request created");
    },
  });

  const updateApprovalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ApprovalRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests", projectId] });
      setSelectedApprovalId(null);
      setFeedback("");
      toast.success("Approval status updated");
    },
  });

  const handleCreateApproval = () => {
    if (!newApproval.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    createApprovalMutation.mutate(newApproval);
  };

  const handleApprove = (approvalId) => {
    updateApprovalMutation.mutate({
      id: approvalId,
      data: {
        status: "approved",
        feedback,
        approved_date: new Date().toISOString(),
      },
    });
  };

  const handleRequestChanges = (approvalId) => {
    updateApprovalMutation.mutate({
      id: approvalId,
      data: {
        status: "changes_requested",
        feedback,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Approval Workflow</h3>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No approval requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const StatusIcon = STATUS_ICONS[approval.status];
            return (
              <Card
                key={approval.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedApprovalId(approval.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {approval.title}
                        </h4>
                        {approval.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {approval.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[approval.status] || "bg-gray-100"}>
                      {approval.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>{approval.type}</span>
                    {approval.due_date && (
                      <span>Due {format(new Date(approval.due_date), 'MMM d')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Approval Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Approval Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <Input
                value={newApproval.title}
                onChange={(e) => setNewApproval({ ...newApproval, title: e.target.value })}
                placeholder="What needs approval?"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <Textarea
                value={newApproval.description}
                onChange={(e) =>
                  setNewApproval({ ...newApproval, description: e.target.value })
                }
                placeholder="Additional details..."
                className="mt-1 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <Select
                  value={newApproval.type}
                  onValueChange={(v) => setNewApproval({ ...newApproval, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="copy">Copy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <Select
                  value={newApproval.priority}
                  onValueChange={(v) => setNewApproval({ ...newApproval, priority: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateApproval} disabled={createApprovalMutation.isPending}>
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Detail Dialog */}
      {selectedApprovalId && (
        <Dialog open={!!selectedApprovalId} onOpenChange={() => setSelectedApprovalId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Approval Request</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Feedback
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add your feedback or comments..."
                  className="mt-1 h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleRequestChanges(selectedApprovalId)}
                disabled={updateApprovalMutation.isPending}
              >
                Request Changes
              </Button>
              <Button
                onClick={() => handleApprove(selectedApprovalId)}
                disabled={updateApprovalMutation.isPending}
              >
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}