import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  return { user, isLoading, error };
}