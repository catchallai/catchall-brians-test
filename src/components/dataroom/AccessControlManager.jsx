import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export default function AccessControlManager({ dataRoomId }) {
  const [showModal, setShowModal] = useState(false);
  const [editingAccess, setEditingAccess] = useState(null);
  const [formData, setFormData] = useState({
    user_email: '',
    permission_level: 'view',
    can_view: true,
    can_download: false,
    can_manage_users: false,
    download_limit: '',
    password_required: false,
    expiry_date: '',
    notify_on_view: true,
    notify_on_download: true,
  });
  const queryClient = useQueryClient();

  const { data: accessControls = [] } = useQuery({
    queryKey: ['dr-access-controls', dataRoomId],
    queryFn: async () => {
      if (!dataRoomId) return [];
      return await base44.entities.DataRoomAccessControl.filter(
        {
          data_room_id: dataRoomId,
          is_active: true,
        },
        '-created_date'
      );
    },
    enabled: !!dataRoomId,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.DataRoomAccessControl.create({
        ...data,
        data_room_id: dataRoomId,
        download_limit: data.download_limit ? parseInt(data.download_limit) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dr-access-controls', dataRoomId] });
      handleModalClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.DataRoomAccessControl.update(editingAccess.id, {
        ...data,
        download_limit: data.download_limit ? parseInt(data.download_limit) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dr-access-controls', dataRoomId] });
      handleModalClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataRoomAccessControl.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dr-access-controls', dataRoomId] });
    },
  });

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAccess(null);
    setFormData({
      user_email: '',
      permission_level: 'view',
      can_view: true,
      can_download: false,
      can_manage_users: false,
      download_limit: '',
      password_required: false,
      expiry_date: '',
      notify_on_view: true,
      notify_on_download: true,
    });
  };

  const handleEdit = (access) => {
    setEditingAccess(access);
    setFormData({
      user_email: access.user_email,
      permission_level: access.permission_level,
      can_view: access.can_view,
      can_download: access.can_download,
      can_manage_users: access.can_manage_users,
      download_limit: access.download_limit?.toString() || '',
      password_required: access.password_required,
      expiry_date: access.expiry_date?.split('T')[0] || '',
      notify_on_view: access.notify_on_view,
      notify_on_download: access.notify_on_download,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.user_email.trim()) return;

    if (editingAccess) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Access Controls</CardTitle>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Access
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {accessControls.length === 0 ? (
          <p className="text-sm text-gray-500">No access controls configured.</p>
        ) : (
          accessControls.map((access) => (
            <div
              key={access.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex-1 space-y-1">
                <div className="font-medium text-gray-900 dark:text-white">{access.user_email}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {access.permission_level}
                  </Badge>
                  {access.can_download && (
                    <Badge variant="secondary" className="text-xs">
                      Download
                    </Badge>
                  )}
                  {access.expiry_date && (
                    <Badge
                      variant={isExpired(access.expiry_date) ? 'destructive' : 'outline'}
                      className="text-xs gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Expires {new Date(access.expiry_date).toLocaleDateString()}
                    </Badge>
                  )}
                  {access.download_limit && (
                    <Badge variant="outline" className="text-xs">
                      {access.downloads_used}/{access.download_limit} downloads
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(access)}>
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(access.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccess ? 'Edit Access' : 'Grant Access'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User Email *</label>
              <Input
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                placeholder="user@example.com"
                type="email"
                className="mt-1"
                disabled={!!editingAccess}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Permission Level</label>
              <Select
                value={formData.permission_level}
                onValueChange={(v) => setFormData({ ...formData, permission_level: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="download">View & Download</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specific Permissions</label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.can_view}
                  onCheckedChange={(v) => setFormData({ ...formData, can_view: v })}
                />
                <span className="text-sm">Can view documents</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.can_download}
                  onCheckedChange={(v) => setFormData({ ...formData, can_download: v })}
                />
                <span className="text-sm">Can download documents</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.can_manage_users}
                  onCheckedChange={(v) => setFormData({ ...formData, can_manage_users: v })}
                />
                <span className="text-sm">Can manage user access</span>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">Download Limit (blank = unlimited)</label>
              <Input
                type="number"
                value={formData.download_limit}
                onChange={(e) => setFormData({ ...formData, download_limit: e.target.value })}
                placeholder="e.g., 5"
                className="mt-1"
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Expiry Date (optional)</label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notifications</label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.notify_on_view}
                  onCheckedChange={(v) => setFormData({ ...formData, notify_on_view: v })}
                />
                <span className="text-sm">Notify on view</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.notify_on_download}
                  onCheckedChange={(v) => setFormData({ ...formData, notify_on_download: v })}
                />
                <span className="text-sm">Notify on download</span>
              </label>
            </div>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.password_required}
                onCheckedChange={(v) => setFormData({ ...formData, password_required: v })}
              />
              <span className="text-sm">Require password to access</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.user_email.trim()}>
              {editingAccess ? 'Update' : 'Grant'} Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
