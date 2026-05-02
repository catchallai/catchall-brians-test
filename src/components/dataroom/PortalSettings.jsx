import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PortalSettings({ portal, portalId }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(portal?.status || 'active');

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DataRoomPortal.update(portalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataroom-portals'] });
      toast.success('Portal settings updated');
    },
  });

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    updateMutation.mutate({ status: newStatus });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Portal Settings</h3>

        <div className="space-y-4">
          {/* Portal Name */}
          <div>
            <label className="text-sm font-medium">Portal Name</label>
            <p className="text-lg font-semibold mt-1">{portal?.name}</p>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium block mb-2">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capabilities */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              {portal?.allow_upload ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm">Upload</span>
            </div>
            <div className="flex items-center gap-2">
              {portal?.allow_download ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm">Download</span>
            </div>
          </div>

          {/* Created By */}
          {portal?.created_by_name && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Created by {portal.created_by_name}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}