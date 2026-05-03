import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Copy, Clock, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DataRoomManager({ projectId, approvedFolderId }) {
  const queryClient = useQueryClient();
  const [showNewAccess, setShowNewAccess] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');

  // Fetch data room
  const { data: dataRoom } = useQuery({
    queryKey: ['data-room', projectId],
    queryFn: async () => {
      const rooms = await base44.entities.ProjectDataRoom.filter({
        project_id: projectId,
      });
      return rooms[0];
    },
    enabled: !!projectId,
  });

  // Fetch access list
  const { data: accessList = [] } = useQuery({
    queryKey: ['data-room-access', dataRoom?.id],
    queryFn: async () => {
      if (!dataRoom?.id) return [];
      return await base44.entities.DataRoomAccess.filter({
        data_room_id: dataRoom.id,
      });
    },
    enabled: !!dataRoom?.id,
  });

  // Grant access
  const grantAccessMutation = useMutation({
    mutationFn: async (email) => {
      const response = await base44.functions.invoke('grantDataRoomAccess', {
        dataRoomId: dataRoom.id,
        contactEmail: email,
        contactName: newName || email.split('@')[0],
        accessLevel,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['data-room-access', dataRoom?.id] });
      setNewEmail('');
      setNewName('');
      setShowNewAccess(false);
      toast.success(`Access granted to ${newEmail}`);
    },
    onError: () => toast.error('Failed to grant access'),
  });

  // Revoke access
  const revokeAccessMutation = useMutation({
    mutationFn: async (accessId) => {
      return await base44.entities.DataRoomAccess.update(accessId, {
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-access', dataRoom?.id] });
      toast.success('Access revoked');
    },
  });

  // Sync files
  const syncFilesMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('syncApprovedFilesToDataRoom', {
        projectId,
        dataRoomId: dataRoom.id,
      });
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.data.synced} files`);
    },
  });

  if (!dataRoom) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          No data room configured for this project
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Data Room</CardTitle>
            <Button
              size="sm"
              onClick={() => syncFilesMutation.mutate()}
              disabled={syncFilesMutation.isPending}
            >
              {syncFilesMutation.isPending ? 'Syncing...' : 'Sync Approved Files'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Data Room Name</p>
            <p className="text-sm text-gray-600">{dataRoom.name}</p>
          </div>
          {dataRoom.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-sm text-gray-600">{dataRoom.description}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={dataRoom.auto_sync_approved_folder ? 'default' : 'outline'}>
              {dataRoom.auto_sync_approved_folder ? 'Auto-sync enabled' : 'Auto-sync disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Client Access List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Client Access</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowNewAccess(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Grant Access
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {accessList.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No clients have access yet</p>
          ) : (
            <div className="space-y-2">
              {accessList.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{access.contact_name}</p>
                    <p className="text-xs text-gray-500">{access.contact_email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {access.access_level}
                      </Badge>
                      {access.is_active ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {access.expires_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(access.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {access.is_active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeAccessMutation.mutate(access.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Access Form */}
      {showNewAccess && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="pt-6 space-y-3">
            <Input
              placeholder="Client email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
            />
            <Input
              placeholder="Client name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="view">View only</option>
              <option value="download">Download</option>
              <option value="comment">Download & Comment</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewAccess(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => grantAccessMutation.mutate(newEmail)}
                disabled={!newEmail.trim() || grantAccessMutation.isPending}
              >
                {grantAccessMutation.isPending ? 'Granting...' : 'Grant Access'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}