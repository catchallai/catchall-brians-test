import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import type { TagOption } from '@/types/tags';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation<TagOption, Error, string>({
    mutationFn: async (name: string): Promise<TagOption> => {
      const raw = await base44.entities.SocialTag.create({
        name: name.trim(),
        slug: slugify(name),
      });
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
