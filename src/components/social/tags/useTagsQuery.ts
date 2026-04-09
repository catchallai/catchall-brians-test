import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import type { TagOption } from '@/types/tags';

export function useTagsQuery() {
  return useQuery<TagOption[]>({
    queryKey: ['social-tags'],
    queryFn: async () => {
      const all = await base44.entities.SocialTag.list('-created_date', 100);
      return all.filter((t: TagOption) => !t.is_archived);
    },
    // Tags are low-churn reference data. Without staleTime, every consumer mount triggers a
    // refetch and causes selected tag pills to briefly disappear during the loading window.
    staleTime: 5 * 60 * 1000,
  });
}
