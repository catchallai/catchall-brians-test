import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useOrganizationContext() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const currentContext = user?.current_context || { type: 'all', id: null };
  
  return {
    organizationId: currentContext.type === 'organization' ? currentContext.id : null,
    brandId: currentContext.type === 'brand' ? currentContext.id : null,
    companyId: currentContext.type === 'company' ? currentContext.id : null,
    contextType: currentContext.type,
    isOrganizationContext: currentContext.type === 'organization',
    hasContext: currentContext.type !== 'all',
  };
}