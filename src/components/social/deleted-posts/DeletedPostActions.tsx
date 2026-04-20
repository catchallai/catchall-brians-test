import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRestorePost } from '@/components/hooks/useRestorePost';
import { usePermanentlyDeletePost } from '@/components/hooks/usePermanentlyDeletePost';
import COPY from '@/lib/copy';

type Props = {
  postId: string;
};

const DeletedPostActions = ({ postId }: Props) => {
  const [permanentOpen, setPermanentOpen] = useState(false);
  const restore = useRestorePost();
  const permanentDelete = usePermanentlyDeletePost();
  const mutationPending = restore.isPending || permanentDelete.isPending;
  const copy = COPY.deletedPosts.dialogs.permanentDelete;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation();
            restore.mutate(postId);
          }}
          disabled={mutationPending}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {COPY.deletedPosts.restore}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            if (!mutationPending) setPermanentOpen(true);
          }}
          disabled={mutationPending}
          aria-label={COPY.deletedPosts.deleteForever}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <ConfirmDialog
        open={permanentOpen}
        onClose={() => setPermanentOpen(false)}
        onConfirm={() => {
          permanentDelete.mutate(postId, {
            onSuccess: () => setPermanentOpen(false),
          });
        }}
        title={copy.title}
        description={copy.body}
        confirmLabel={copy.confirm}
        cancelLabel={copy.cancel}
        isLoading={permanentDelete.isPending}
      />
    </>
  );
};

export default DeletedPostActions;
