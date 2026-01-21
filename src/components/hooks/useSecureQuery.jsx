import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook for querying entities with automatic department/role access control
 * Validates access before fetching and filters results based on permissions
 */
export function useSecureQuery(entityName, filters = {}, options = {}) {
  return useQuery({
    queryKey: ['secure-query', entityName, JSON.stringify(filters)],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getSecureEntityData', {
          entityName,
          filters
        });
        return response.data || [];
      } catch (error) {
        if (error.response?.status === 403) {
          console.warn(`Access denied to ${entityName}`);
          return [];
        }
        throw error;
      }
    },
    ...options
  });
}

export default useSecureQuery;