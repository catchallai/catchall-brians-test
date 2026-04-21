import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/enums';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Shield, Eye, Edit } from 'lucide-react';

export default function TeamManager() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      base44.entities.User.update(userId, { social_media_role: role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });

  const isAdmin =
    currentUser?.role === UserRole.ADMIN || currentUser?.social_media_role === UserRole.ADMIN;

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members & Roles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allUsers.map((user) => {
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                      {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.role === UserRole.ADMIN && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                    >
                      App Admin
                    </Badge>
                  )}
                  <Select
                    value={user.social_media_role || UserRole.EDITOR}
                    onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                    disabled={user.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Admin
                        </div>
                      </SelectItem>
                      <SelectItem value={UserRole.EDITOR}>
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" /> Editor
                        </div>
                      </SelectItem>
                      <SelectItem value={UserRole.VIEWER}>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Viewer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm text-blue-900 dark:text-blue-300 mb-2">
            Role Permissions
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>
              <strong>Admin:</strong> Full access — create, edit, delete, assign, approve, manage
              team
            </li>
            <li>
              <strong>Approver:</strong> Review submissions, approve or reject posts, request
              changes
            </li>
            <li>
              <strong>Editor:</strong> Create &amp; edit posts, submit for review, leave comments
            </li>
            <li>
              <strong>Viewer:</strong> View-only — can see posts and comments but cannot edit
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
