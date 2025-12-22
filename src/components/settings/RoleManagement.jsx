import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import RoleEditorModal from './RoleEditorModal';

const modules = [
  { id: 'crm', label: 'CRM', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'sales', label: 'Sales', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'marketing', label: 'Marketing', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'seo', label: 'SEO', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'social', label: 'Social', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'content', label: 'Content', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'analytics', label: 'Analytics', permissions: ['view'] },
  { id: 'settings', label: 'Settings', permissions: ['view', 'manage'] }
];

export default function RoleManagement() {
  const [editingRole, setEditingRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const countPermissions = (role) => {
    let count = 0;
    Object.values(role.permissions || {}).forEach(module => {
      count += Object.values(module).filter(Boolean).length;
    });
    return count;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-semibold">Roles & Permissions</h2>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {role.name}
                  </h4>
                  {role.is_system_role && (
                    <Badge variant="secondary">System</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {role.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-100 text-violet-700">
                    {countPermissions(role)} permissions
                  </Badge>
                  {role.permissions && Object.keys(role.permissions).map((module) => (
                    <Badge key={module} variant="outline" className="text-xs">
                      {modules.find(m => m.id === module)?.label || module}
                    </Badge>
                  ))}
                </div>
              </div>
              {!role.is_system_role && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingRole(role)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(role.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {roles.length === 0 && (
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No roles created yet</p>
          </Card>
        )}
      </div>

      {(showCreate || editingRole) && (
        <RoleEditorModal
          role={editingRole}
          open={showCreate || !!editingRole}
          onClose={() => {
            setShowCreate(false);
            setEditingRole(null);
          }}
          modules={modules}
        />
      )}
    </div>
  );
}