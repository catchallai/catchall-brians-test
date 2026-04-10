import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { slugifyTag } from '@/utils/tags';
import type { TagOption } from '@/types/tags';

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation<TagOption, Error, { name: string; color?: string }>({
    mutationFn: async ({ name, color }): Promise<TagOption> => {
      const trimmedName = name.trim();
      const slug = slugifyTag(trimmedName);
      const payload: Record<string, unknown> = { name: trimmedName };
      if (slug) payload.slug = slug;
      if (color) payload.color = color;
      const raw = await base44.entities.SocialTag.create(payload);
      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        color: raw.color,
        description: raw.description,
      };
    },
    onSuccess: (newTag) => {
      queryClient.setQueryData<TagOption[]>(['social-tags'], (old = []) => [...old, newTag]);
    },
  });
}
