import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, Search, Mail, Shield, Trash2, Edit2, Loader2, UserCheck
} from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';

const ROLES = ['admin', 'editor', 'viewer', 'user'];
const DEPARTMENTS = ['business_dev', 'sales', 'marketing', 'media', 'collaboration', 'assets', 'executive', 'admin'];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showSectionAccess, setShowSectionAccess] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['user-departments'],
    queryFn: () => base44.entities.UserDepartment.list('-created_date', 1000),
  });

  const { data: sectionAccess = [] } = useQuery({
    queryKey: ['user-section-access'],
    queryFn: () => base44.entities.UserSectionAccess.list('-created_date', 1000),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ email, department }) => {
      const existing = departments.find(d => d.user_email === email);
      if (existing) {
        return base44.entities.UserDepartment.update(existing.id, { department });
      } else {
        return base44.entities.UserDepartment.create({ user_email: email, department });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-departments'] });
      setEditingDept(null);
      setSelectedDept('');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ user_email, new_role }) => 
      base44.functions.invoke('updateUserRole', { user_email, new_role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingRole(null);
      setSelectedRole('');
    },
  });

  const toggleSectionMutation = useMutation({
    mutationFn: ({ user_email, section, enabled }) => {
      const existing = sectionAccess.find(s => s.user_email === user_email && s.section === section);
      if (existing) {
        return base44.entities.UserSectionAccess.update(existing.id, { enabled });
      } else {
        return base44.entities.UserSectionAccess.create({ user_email, section, enabled });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-section-access'] });
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const userDept = departments.find(d => d.user_email === user.email);
    const matchesDept = deptFilter === 'all' || userDept?.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  const getUserDepartment = (email) => {
    return departments.find(d => d.user_email === email);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      editor: 'bg-blue-100 text-blue-700',
      viewer: 'bg-yellow-100 text-yellow-700',
      user: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getDeptColor = (dept) => {
    const colors = {
      business_dev: 'bg-purple-100 text-purple-700',
      sales: 'bg-green-100 text-green-700',
      marketing: 'bg-pink-100 text-pink-700',
      media: 'bg-orange-100 text-orange-700',
      collaboration: 'bg-blue-100 text-blue-700',
      assets: 'bg-indigo-100 text-indigo-700',
      executive: 'bg-red-100 text-red-700',
      admin: 'bg-gray-100 text-gray-700',
    };
    return colors[dept] || 'bg-gray-100 text-gray-700';
  };

  // Only show this page to admins
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
        <p className="text-gray-500 mt-2">Only admins can access user management</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-500 mt-1">Manage users, roles, and departments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-sm text-gray-500">Admins</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
            <p className="text-sm text-gray-500">Departments Assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(role => (
              <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept.replace(/_/g, ' ').toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No users found"
          description="Adjust your filters to find users"
        />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Department</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const userDept = getUserDepartment(user.email);
                  const isEditing = editingDept?.id === user.id;
                  return (
                    <tr 
                      key={user.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                              {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900 dark:text-white">{user.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</span>
                      </td>
                      <td className="py-4 px-6">
                        {editingRole?.id === user.id ? (
                          <div className="flex gap-2">
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(role => (
                                  <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                updateRoleMutation.mutate({ user_email: user.email, new_role: selectedRole });
                              }}
                              disabled={!selectedRole || updateRoleMutation.isPending}
                            >
                              {updateRoleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRole(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRoleColor(user.role)} border-0`}>
                              {user.role}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingRole(user);
                                setSelectedRole(user.role);
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Select value={selectedDept} onValueChange={setSelectedDept}>
                              <SelectTrigger className="w-40 h-8">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEPARTMENTS.map(dept => (
                                  <SelectItem key={dept} value={dept}>{dept.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                updateDeptMutation.mutate({ email: user.email, department: selectedDept });
                              }}
                              disabled={!selectedDept || updateDeptMutation.isPending}
                            >
                              {updateDeptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingDept(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {userDept ? (
                              <Badge className={`${getDeptColor(userDept.department)} border-0`}>
                                {userDept.department.replace(/_/g, ' ')}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">Unassigned</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingDept(user);
                                setSelectedDept(userDept?.department || '');
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(user.created_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setShowSectionAccess(showSectionAccess?.id === user.id ? null : user)}
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setDeleteConfirm(user)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Section Access Modal */}
      {showSectionAccess && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Section Access for {showSectionAccess.full_name}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {['dashboard', 'contacts', 'companies', 'deals', 'activities', 'campaigns', 'emailMarketing', 'seoDashboard', 'keywords', 'backlinks', 'seoAudit', 'socialMedia', 'socialListening', 'socialCalendar', 'contentStudio', 'landing_pages', 'automation', 'docutrace', 'legal_documents', 'data_rooms', 'reports', 'settings', 'admin'].map(section => {
                const access = sectionAccess.find(s => s.user_email === showSectionAccess.email && s.section === section);
                const isEnabled = access ? access.enabled : true;
                return (
                  <div key={section} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{section.replace(/_/g, ' ')}</span>
                    <button
                      onClick={() => toggleSectionMutation.mutate({
                        user_email: showSectionAccess.email,
                        section,
                        enabled: !isEnabled
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowSectionAccess(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke {deleteConfirm?.full_name}'s access to the system. They can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}