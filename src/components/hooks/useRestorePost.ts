import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import COPY from '@/lib/copy';

export const useRestorePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => base44.functions.invoke('restorePost', { postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      toast.success(COPY.deletedPosts.toasts.restored);
    },
    onError: () => {
      toast.error(COPY.deletedPosts.toasts.restoreFailed);
    },
  });
};
