import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PermanentDeleteDialog from './PermanentDeleteDialog';
import { useRestorePost } from '@/components/hooks/useRestorePost';
import { usePermanentlyDeletePost } from '@/components/hooks/usePermanentlyDeletePost';
import COPY from '@/lib/copy';

type Post = { id: string };

type Props = {
  post: Post;
};

const DeletedPostActions = ({ post }: Props) => {
  const [permanentOpen, setPermanentOpen] = useState(false);
  const restore = useRestorePost();
  const permanentDelete = usePermanentlyDeletePost();

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation();
            restore.mutate(post.id);
          }}
          disabled={restore.isPending}
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
            setPermanentOpen(true);
          }}
          aria-label={COPY.deletedPosts.deleteForever}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <PermanentDeleteDialog
        open={permanentOpen}
        onOpenChange={setPermanentOpen}
        onConfirm={() => {
          permanentDelete.mutate(post.id, {
            onSuccess: () => setPermanentOpen(false),
          });
        }}
        pending={permanentDelete.isPending}
      />
    </>
  );
};

export default DeletedPostActions;
