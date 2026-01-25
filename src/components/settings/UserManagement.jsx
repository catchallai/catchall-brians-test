import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all roles');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({
    full_name: '',
    role: '',
    title: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    department: '',
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await base44.users.inviteUser(inviteEmail, inviteRole);
    },
    onSuccess: () => {
      toast.success('User invited successfully');
      setInviteEmail('');
      setInviteRole('user');
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(error.message || 'Failed to invite user'),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      // Use backend function for full_name and email (admin fields)
      const { full_name, email, ...otherData } = data;
      
      const updatePayload = { ...otherData };
      if (full_name) updatePayload.full_name = full_name;
      if (email) updatePayload.email = email;

      // If updating name or email, use admin function
      if (full_name || email) {
        await base44.functions.invoke('updateUserProfile', {
          userId,
          full_name,
          email,
        });
      }

      // Update other fields via regular API
      if (Object.keys(otherData).length > 0) {
        await base44.entities.User.update(userId, otherData);
      }
    },
    onSuccess: () => {
      toast.success('User updated');
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => toast.error(error?.message || 'Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
    },
    onSuccess: () => {
      toast.success('User removed');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all roles' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    user: users.filter(u => u.role === 'user').length,
    total: users.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage team members and their roles</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Add a new team member to your workspace</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="w-full"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.admin}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.user}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all roles">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Role</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900 dark:text-white">{user.full_name || 'No name'}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-4 px-6">
                        <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditData({
                                    full_name: user.full_name || '',
                                    role: user.role,
                                    title: user.title || '',
                                    phone: user.phone || '',
                                    address: user.address || '',
                                    city: user.city || '',
                                    state: user.state || '',
                                    zip_code: user.zip_code || '',
                                    country: user.country || '',
                                    department: user.department || '',
                                  });
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>Update user information and role</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Personal Info */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Personal Information</h3>
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label>Full Name</Label>
                                      <Input
                                        value={editData.full_name}
                                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Email</Label>
                                      <Input
                                        value={editData.email || user.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Job Title</Label>
                                      <Input
                                        value={editData.title}
                                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Department</Label>
                                      <Input
                                        value={editData.department}
                                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Contact Info */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Contact Information</h3>
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label>Phone</Label>
                                      <Input
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Location */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Location</h3>
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label>Street Address</Label>
                                      <Input
                                        value={editData.address}
                                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                          value={editData.city}
                                          onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>State/Province</Label>
                                        <Input
                                          value={editData.state}
                                          onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Zip/Postal Code</Label>
                                        <Input
                                          value={editData.zip_code}
                                          onChange={(e) => setEditData({ ...editData, zip_code: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input
                                          value={editData.country}
                                          onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Role */}
                                <div className="border-t pt-4">
                                  <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={editData.role} onValueChange={(value) => setEditData({ ...editData, role: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <Button
                                  onClick={() => updateUserMutation.mutate({ userId: user.id, data: editData })}
                                  disabled={updateUserMutation.isPending}
                                  className="w-full"
                                >
                                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 px-6 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}