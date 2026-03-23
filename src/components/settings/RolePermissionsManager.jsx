import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const SECTIONS = [
  'dashboard',
  'contacts',
  'companies',
  'deals',
  'activities',
  'campaigns',
  'emailMarketing',
  'reports',
  'seoDashboard',
  'keywords',
  'backlinks',
  'seoAudit',
  'socialMedia',
  'socialListening',
  'socialCalendar',
  'hashtags',
  'competitors',
  'contentStudio',
  'landing_pages',
  'automation',
  'docutrace',
  'legal_documents',
  'data_rooms',
  'settings',
  'admin',
];

const ROLES = ['admin', 'editor', 'viewer', 'user'];
const ACTIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_export', label: 'Export' },
];

export default function RolePermissionsManager() {
  const [selectedRole, setSelectedRole] = useState('editor');
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const perms = await base44.entities.RolePermission.filter({ role: selectedRole });
      return perms;
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ section, action, value }) => {
      const existing = permissions.find((p) => p.section === section);

      if (existing) {
        return await base44.entities.RolePermission.update(existing.id, {
          [action]: value,
        });
      } else {
        const newPerm = { role: selectedRole, section };
        ACTIONS.forEach((a) => {
          newPerm[a.key] = a.key === action ? value : false;
        });
        return await base44.entities.RolePermission.create(newPerm);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole] });
    },
  });

  const getPermissionValue = (section, action) => {
    const perm = permissions.find((p) => p.section === section);
    return perm?.[action] || false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Role-Based Access Control</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage permissions for each role across different sections
        </p>
      </div>

      <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {ROLES.map((role) => (
            <TabsTrigger key={role} value={role} className="capitalize">
              {role}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map((role) => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{role} Permissions</CardTitle>
                <CardDescription>Configure what {role}s can do across sections</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Section</th>
                          {ACTIONS.map((action) => (
                            <th key={action.key} className="text-center py-3 px-4 font-semibold">
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SECTIONS.map((section) => (
                          <tr
                            key={section}
                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="py-3 px-4 font-medium capitalize">
                              {section.replace(/_/g, ' ')}
                            </td>
                            {ACTIONS.map((action) => (
                              <td key={action.key} className="text-center py-3 px-4">
                                <Switch
                                  checked={getPermissionValue(section, action.key)}
                                  onCheckedChange={(value) => {
                                    updatePermissionMutation.mutate({
                                      section,
                                      action: action.key,
                                      value,
                                    });
                                  }}
                                  disabled={updatePermissionMutation.isPending || role === 'admin'}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">About Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <p>
            <strong>Admin:</strong> Full access to all sections and actions
          </p>
          <p>
            <strong>Editor:</strong> Can create, edit content; limited delete access
          </p>
          <p>
            <strong>Viewer:</strong> Read-only access to most sections; can export reports
          </p>
          <p>
            <strong>User:</strong> Very limited access; personal dashboard and settings only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
