import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { slugifyTag } from '@/utils/tags';
import type { TagOption } from '@/types/tags';

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation<TagOption, Error, string>({
    mutationFn: async (name: string): Promise<TagOption> => {
      const trimmedName = name.trim();
      const slug = slugifyTag(trimmedName);
      const payload: Record<string, any> = { name: trimmedName };
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
