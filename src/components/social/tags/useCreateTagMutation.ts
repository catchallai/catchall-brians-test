import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import type { TagOption } from '@/types/tags';
import { slugifyTag } from '@/utils/tags';

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation<TagOption, Error, string>({
    mutationFn: async (name: string): Promise<TagOption> => {
      const slug = slugifyTag(name);
      const payload: Record<string, any> = { name: name.trim() };
      if (slug) payload.slug = slug;
      // Entity name is 'Tag' — must match useTagsQuery and SocialTags.jsx so all callers
      // share the same Base44 entity and the ['social-tags'] cache key stays in sync.
      const raw = await base44.entities.Tag.create(payload);
      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        color: raw.color,
        description: raw.description,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-tags'] });
    },
  });
}
