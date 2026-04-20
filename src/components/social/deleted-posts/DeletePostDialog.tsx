import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import COPY from '@/lib/copy';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  platforms?: string[];
  hasBeenPublished: boolean;
  pending?: boolean;
};

const formatPlatformList = (platforms: string[]): string => {
  if (platforms.length === 0) return '';
  if (platforms.length === 1) return platforms[0];
  if (platforms.length === 2) return `${platforms[0]} and ${platforms[1]}`;
  const head = platforms.slice(0, -1).join(', ');
  return `${head}, and ${platforms[platforms.length - 1]}`;
};

const DeletePostDialog = ({
  open,
  onOpenChange,
  onConfirm,
  platforms = [],
  hasBeenPublished,
  pending,
}: Props) => {
  const copy = hasBeenPublished
    ? COPY.deletedPosts.dialogs.deletePublished
    : COPY.deletedPosts.dialogs.deleteDraft;
  const platformList = formatPlatformList(platforms);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent role="alertdialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-gray-600">
              {hasBeenPublished ? (
                <>
                  <p>{COPY.deletedPosts.dialogs.deletePublished.bodyLead}</p>
                  {platformList && (
                    <p>{COPY.deletedPosts.dialogs.deletePublished.bodyUnpublish(platformList)}</p>
                  )}
                  <p>{COPY.deletedPosts.dialogs.deletePublished.bodyRestore}</p>
                </>
              ) : (
                <p>{COPY.deletedPosts.dialogs.deleteDraft.body}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel autoFocus>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {copy.confirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePostDialog;
