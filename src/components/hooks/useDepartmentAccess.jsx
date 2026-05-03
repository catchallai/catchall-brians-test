import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { hasModuleAccess, getDepartmentModules } from '@/lib/departmentPermissions';

/**
 * Hook to check if current user has access to a module based on department
 */
export function useDepartmentAccess(moduleName) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const hasAccess = user ? hasModuleAccess(user.department, moduleName) : false;
  const department = user?.department || null;

  return {
    hasAccess,
    department,
    modules: department ? getDepartmentModules(department) : [],
  };
}

/**
 * Hook to get all accessible modules for current user
 */
export function useAccessibleModules() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const department = user?.department || null;
  const modules = department ? getDepartmentModules(department) : [];

  return {
    department,
    modules,
    count: modules.length,
  };
}