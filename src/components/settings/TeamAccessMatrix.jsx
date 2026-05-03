import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { DEPARTMENT_PERMISSIONS } from '@/lib/departmentPermissions';

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

  // Calculate access percentage for progress bar
  const getAccessPercentage = (user) => {
    if (allModules.length === 0) return 0;
    const accessCount = allModules.filter((m) => hasAccess(user, m)).length;
    return (accessCount / allModules.length) * 100;
  };

  if (isLoading) {
    return <div className="p-6 bg-gray-100 h-64 rounded animate-pulse" />;
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Members & access</h2>
            <p className="text-sm text-gray-600 mt-1">Manage team member permissions and access levels</p>
          </div>
          <span className="text-sm text-gray-600">{filteredUsers.length} members</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
              {allModules.map((module) => (
                <th key={module} className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                  {module}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={allModules.length + 2} className="px-6 py-8 text-center text-gray-500">
                  No members found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: DEPARTMENT_COLORS[user.department] || '#64748b' }}
                      >
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{user.department || 'Unassigned'}</span>
                  </td>

                  {/* Access Dots */}
                  {allModules.map((module) => (
                    <td key={`${user.id}-${module}`} className="px-4 py-4 text-center">
                      {hasAccess(user, module) ? (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Progress Bar - visible below table when data exists */}
      {filteredUsers.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-4">
          {filteredUsers.map((user) => (
            <div key={`progress-${user.id}`} className="mb-3">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 transition-all"
                  style={{ width: `${getAccessPercentage(user)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Blue dot = has access | Empty circle = no access
        </p>
      </div>
    </div>
  );
}