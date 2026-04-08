import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import type { TagOption } from '@/types/tags';

export function useTagsQuery() {
  return useQuery<TagOption[]>({
    queryKey: ['social-tags'],
    queryFn: () => base44.entities.Tag.list('-created_date'),
  });
}
