import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, MoreVertical } from 'lucide-react';
import { DEPARTMENT_PERMISSIONS, DEPARTMENTS } from '@/lib/departmentPermissions';

const DEPARTMENT_COLORS = {
  'Business Dev': '#3b82f6',
  'Sales': '#06b6d4',
  'Marketing': '#a855f7',
  'Human Resources': '#ec4899',
  'Legal': '#ef4444',
  'Finance': '#22c55e',
  'Engineering': '#6366f1',
  'Information Technology': '#f97316',
  'Admin': '#64748b',
  'SuperAdmin': '#000000',
};

export default function TeamAccessMatrix() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers;
    },
  });

  // Get all unique modules across all departments
  const allModules = useMemo(() => {
    const modules = new Set();
    Object.values(DEPARTMENT_PERMISSIONS).forEach((deptModules) => {
      deptModules.forEach((m) => modules.add(m));
    });
    return Array.from(modules).sort();
  }, []);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchQuery]);

  // Check if user has access to a module
  const hasAccess = (user, moduleName) => {
    if (!user.department) return false;
    const deptModules = DEPARTMENT_PERMISSIONS[user.department] || [];
    return deptModules.includes(moduleName);
  };

  if (isLoading) {
    return <div className="p-6 bg-gray-100 h-64 rounded animate-pulse" />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members & access</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage team member permissions and access levels
            </p>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {filteredUsers.length} members
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Name
              </th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-20">
                Role
              </th>
              {allModules.map((module) => (
                <th
                  key={module}
                  className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-20"
                >
                  {module}
                </th>
              ))}
              <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-12" />
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={allModules.length + 3}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No members found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  {/* Name */}
                  <td className="sticky left-0 bg-white dark:bg-gray-900 z-10 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: DEPARTMENT_COLORS[user.department] || '#64748b' }}
                      >
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role/Department */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {user.department || 'Unassigned'}
                    </span>
                  </td>

                  {/* Access Dots */}
                  {allModules.map((module) => (
                    <td key={`${user.id}-${module}`} className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        {hasAccess(user, module) ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border-1.5 border-gray-300 dark:border-gray-600" />
                        )}
                      </div>
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="px-4 py-4 text-center">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-2" />
          Blue dot = has access | Empty circle = no access
        </p>
      </div>
    </div>
  );
}