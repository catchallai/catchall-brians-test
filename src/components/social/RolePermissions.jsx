import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Define role permissions
const ROLE_PERMISSIONS = {
  admin: {
    create_posts: true,
    edit_own_posts: true,
    edit_all_posts: true,
    delete_posts: true,
    approve_posts: true,
    assign_reviewers: true,
    manage_users: true,
    view_analytics: true,
    comment: true,
  },
  approver: {
    create_posts: true,
    edit_own_posts: true,
    edit_all_posts: false,
    delete_posts: false,
    approve_posts: true,
    assign_reviewers: false,
    manage_users: false,
    view_analytics: true,
    comment: true,
  },
  editor: {
    create_posts: true,
    edit_own_posts: true,
    edit_all_posts: false,
    delete_posts: false,
    approve_posts: false,
    assign_reviewers: false,
    manage_users: false,
    view_analytics: false,
    comment: true,
  },
  viewer: {
    create_posts: false,
    edit_own_posts: false,
    edit_all_posts: false,
    delete_posts: false,
    approve_posts: false,
    assign_reviewers: false,
    manage_users: false,
    view_analytics: true,
    comment: false,
  },
};

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const userRole = user?.role || 'viewer';
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.viewer;

  const can = (permission) => permissions[permission] || false;

  const canEditPost = (post) => {
    if (!user) return false;
    if (permissions.edit_all_posts) return true;
    if (permissions.edit_own_posts && post?.created_by === user.email) return true;
    return false;
  };

  const canApprovePost = (post) => {
    if (!user) return false;
    if (!permissions.approve_posts) return false;
    // Can approve if assigned as reviewer or is admin
    return post?.assigned_to_email === user.email || userRole === 'admin';
  };

  const canDeletePost = (post) => {
    if (!user) return false;
    if (permissions.delete_posts) return true;
    return false;
  };

  return {
    user,
    userRole,
    permissions,
    can,
    canEditPost,
    canApprovePost,
    canDeletePost,
  };
}

// Component to display user role badge
export function RoleBadge({ role }) {
  const roleColors = {
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    approver: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    editor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    viewer: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[role] || roleColors.viewer}`}>
      {role?.charAt(0).toUpperCase() + role?.slice(1) || 'Viewer'}
    </span>
  );
}

// Component to display permission matrix
export function PermissionMatrix() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            <th className="text-left py-2 px-3">Permission</th>
            {Object.keys(ROLE_PERMISSIONS).map(role => (
              <th key={role} className="text-center py-2 px-3">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.keys(ROLE_PERMISSIONS.admin).map(perm => (
            <tr key={perm} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                {perm.replace(/_/g, ' ').charAt(0).toUpperCase() + perm.slice(1)}
              </td>
              {Object.keys(ROLE_PERMISSIONS).map(role => (
                <td key={role} className="text-center py-2 px-3">
                  {ROLE_PERMISSIONS[role][perm] ? (
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}