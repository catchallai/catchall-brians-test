import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, UserPlus, Trash2, Eye, Edit, MessageSquare, Copy, Check } from "lucide-react";

const PERMISSION_ICONS = {
  view: Eye,
  edit: Edit,
  comment: MessageSquare
};

const PERMISSION_LABELS = {
  view: 'Can View',
  edit: 'Can Edit',
  comment: 'Can Comment'
};

export default function ReportShareModal({ report, open, onClose }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: shares = [] } = useQuery({
    queryKey: ['report-shares', report?.id],
    queryFn: () => base44.entities.ReportShare.filter({ report_id: report.id, is_active: true }),
    enabled: !!report?.id,
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const shareMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ReportShare.create(data);
      
      // Create notification
      await base44.entities.Notification.create({
        user_email: data.shared_with_email,
        type: 'report_shared',
        title: 'Report Shared With You',
        message: `${user.full_name} shared "${report.name}" with ${PERMISSION_LABELS[data.permission]} permission`,
        link: `/reports/${report.id}`,
        data: { report_id: report.id, permission: data.permission }
      });

      // Audit log
      await base44.entities.ReportAuditLog.create({
        report_id: report.id,
        action: 'shared',
        user_email: user.email,
        details: {
          shared_with: data.shared_with_email,
          permission: data.permission,
          timestamp: new Date().toISOString()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-shares'] });
      setEmail('');
      setPermission('view');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (shareId) => {
      await base44.entities.ReportShare.update(shareId, { is_active: false });
      
      // Audit log
      await base44.entities.ReportAuditLog.create({
        report_id: report.id,
        action: 'unshared',
        user_email: user.email,
        details: { timestamp: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-shares'] });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ shareId, newPermission }) => {
      await base44.entities.ReportShare.update(shareId, { permission: newPermission });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-shares'] });
    },
  });

  const handleShare = () => {
    if (!email.trim()) return;
    
    shareMutation.mutate({
      report_id: report.id,
      shared_with_email: email,
      permission,
      shared_by: user.email
    });
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/reports?id=${report.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{report?.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Form */}
          <div className="space-y-4">
            <div>
              <Label>Share with</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && handleShare()}
                />
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can View</SelectItem>
                    <SelectItem value="comment">Can Comment</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShare} disabled={shareMutation.isPending}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopyLink} className="flex-1">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Shared With */}
          <div>
            <Label className="mb-3 block">People with access</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-violet-600 dark:text-violet-300">
                      {report?.created_by?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {report?.created_by}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Owner</p>
                  </div>
                </div>
                <Badge variant="secondary">Owner</Badge>
              </div>

              {/* Shared Users */}
              {shares.map((share) => {
                const PermIcon = PERMISSION_ICONS[share.permission];
                return (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {share.shared_with_email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {share.shared_with_email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Shared by {share.shared_by}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={share.permission}
                        onValueChange={(value) => updatePermissionMutation.mutate({ 
                          shareId: share.id, 
                          newPermission: value 
                        })}
                      >
                        <SelectTrigger className="w-36">
                          <div className="flex items-center gap-2">
                            <PermIcon className="w-3 h-3" />
                            <span className="text-xs">{PERMISSION_LABELS[share.permission]}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">
                            <div className="flex items-center gap-2">
                              <Eye className="w-3 h-3" />
                              Can View
                            </div>
                          </SelectItem>
                          <SelectItem value="comment">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3 h-3" />
                              Can Comment
                            </div>
                          </SelectItem>
                          <SelectItem value="edit">
                            <div className="flex items-center gap-2">
                              <Edit className="w-3 h-3" />
                              Can Edit
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMutation.mutate(share.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {shares.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  No one else has access yet. Share to collaborate!
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}