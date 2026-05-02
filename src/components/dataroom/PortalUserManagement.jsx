import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalUserManagement({ portalId, portalAccessCode }) {
  const queryClient = useQueryClient();
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', company: '', access_level: 'view' });

  const { data: users = [] } = useQuery({
    queryKey: ['portal-users', portalId],
    queryFn: () => base44.entities.DataRoomPortalUser.filter({ portal_id: portalId }),
  });

  const addUserMutation = useMutation({
    mutationFn: (userData) =>
      base44.entities.DataRoomPortalUser.create({ portal_id: portalId, ...userData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users', portalId] });
      setNewUser({ email: '', name: '', company: '', access_level: 'view' });
      setShowAddUser(false);
      toast.success('User added to portal');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.DataRoomPortalUser.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users', portalId] });
      toast.success('User removed');
    },
  });

  const copyAccessCode = () => {
    navigator.clipboard.writeText(portalAccessCode);
    toast.success('Access code copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Access Code Section */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
          Portal Access Code
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
            {portalAccessCode}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyAccessCode}
            className="border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-3">
          Share this 9-digit code with external users to access the portal at:{' '}
          <code className="bg-white dark:bg-blue-900/40 px-2 py-1 rounded">
            /portal/{portalAccessCode}
          </code>
        </p>
      </Card>

      {/* Users List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Portal Users ({users.length})</h3>
          <Button onClick={() => setShowAddUser(!showAddUser)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {showAddUser && (
          <Card className="p-4 mb-4 space-y-3">
            <Input
              placeholder="Email address"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              type="email"
            />
            <Input
              placeholder="Full name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <Input
              placeholder="Company (optional)"
              value={newUser.company}
              onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
            />
            <Select value={newUser.access_level} onValueChange={(value) => setNewUser({ ...newUser, access_level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="upload_download">Upload & Download</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  addUserMutation.mutate(newUser)
                }
                disabled={!newUser.email || !newUser.name}
                className="flex-1"
              >
                Add User
              </Button>
              <Button variant="outline" onClick={() => setShowAddUser(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No external users yet</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.company && (
                    <p className="text-xs text-muted-foreground">{user.company}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {user.access_level === 'view' && 'View Only'}
                    {user.access_level === 'upload_download' && 'Upload & Download'}
                    {user.access_level === 'admin' && 'Admin'}
                  </Badge>
                  {user.access_count && (
                    <span className="text-xs text-muted-foreground">{user.access_count} accesses</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteUserMutation.mutate(user.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}