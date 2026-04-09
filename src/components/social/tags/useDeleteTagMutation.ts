import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import type { TagOption } from '@/types/tags';

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => base44.entities.SocialTag.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<TagOption[]>(['social-tags'], (old = []) =>
        old.filter((t) => t.id !== id)
      );
    },
  });
}
