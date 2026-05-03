import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { DEPARTMENT_PERMISSIONS, DEPARTMENTS } from '@/lib/departmentPermissions';

const DEPARTMENT_COLORS = {
  'Business Dev': 'bg-blue-500',
  'Sales': 'bg-cyan-500',
  'Marketing': 'bg-purple-500',
  'Human Resources': 'bg-pink-500',
  'Legal': 'bg-red-500',
  'Finance': 'bg-green-500',
  'Engineering': 'bg-indigo-500',
  'Information Technology': 'bg-orange-500',
  'Admin': 'bg-gray-700',
  'SuperAdmin': 'bg-black',
};

export default function TeamAccessMatrix() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers;
    },
  });

  // Get unique modules from all departments
  const allModules = useMemo(() => {
    const modules = new Set();
    Object.values(DEPARTMENT_PERMISSIONS).forEach((deptModules) => {
      deptModules.forEach((m) => modules.add(m));
    });
    return Array.from(modules).sort();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDept === 'all' || user.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [users, searchQuery, filterDept]);

  // Check if user has access to a module
  const hasAccess = (user, moduleName) => {
    if (!user.department) return false;
    const deptModules = DEPARTMENT_PERMISSIONS[user.department] || [];
    return deptModules.includes(moduleName);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Members & Access</h2>
        <p className="text-gray-600 dark:text-gray-400">
          View which team members have access to each module based on their department
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matrix View */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800">
                <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 p-4 text-left font-semibold text-sm w-48">
                  Member ({filteredUsers.length})
                </th>
                {allModules.map((module) => (
                  <th
                    key={module}
                    className="p-3 text-xs font-semibold text-center whitespace-nowrap min-w-24"
                  >
                    <div className="flex flex-col items-center">
                      <span>{module.split(' ')[0]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={allModules.length + 1} className="p-6 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Member Cell */}
                    <td className="sticky left-0 bg-white dark:bg-gray-900 z-10 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={`${DEPARTMENT_COLORS[user.department] || 'bg-gray-400'} text-white text-sm font-bold`}
                          >
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.full_name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {user.department || 'Unassigned'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Access Matrix */}
                    {allModules.map((module) => (
                      <td key={`${user.id}-${module}`} className="p-3 text-center">
                        <div className="flex justify-center">
                          {hasAccess(user, module) ? (
                            <div className="w-3 h-3 rounded-full bg-blue-500" title={`${user.full_name} has access to ${module}`} />
                          ) : (
                            <div
                              className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600"
                              title={`${user.full_name} does not have access to ${module}`}
                            />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">What each symbol means</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Member has access to this module (based on their department assignment)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
            <span>Member does not have access to this module</span>
          </div>
          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Access is automatically assigned based on department membership. To change a member's access, update their department assignment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}