import { useState, useRef } from 'react';
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PostComposer, { type PostComposerRef, type PostComposerProps } from './PostComposer';
import { type HashtagPool } from '@/components/social/HashtagPoolSelector';
import type { SocialMediaPost } from '@/types/post';

const TypedDialogContent = DialogContent as React.ComponentType<any>;

type CalendarPostModalProps = {
  open: boolean;
  onClose: () => void;
  post?: SocialMediaPost | null;
  onSave: PostComposerProps['onSave'];
  isLoading: boolean;
  hashtagPool?: HashtagPool[];
  currentMonth?: Date;
};

// This component is a thin wrapper around PostComposer that places it inside a Dialog and manages fullscreen state.
// It also prevents closing the dialog when the user clicks outside or presses escape, and instead delegates that to
// the PostComposer to handle unsaved changes.
export default function CalendarPostModal({
  open,
  onClose,
  post,
  onSave,
  isLoading,
  hashtagPool = [],
  currentMonth = new Date(),
}: CalendarPostModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const composerRef = useRef<PostComposerRef | null>(null);

  const handleClose = () => {
    onClose();
    setIsFullscreen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) composerRef.current?.requestClose();
      }}
    >
      <TypedDialogContent
        className={`p-0 w-full overflow-hidden flex flex-col bg-white dark:bg-gray-900 ${
          isFullscreen
            ? 'inset-0 h-screen max-h-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:rounded-none'
            : 'max-w-5xl max-h-[92vh] rounded-2xl'
        }`}
        windowControls={false}
        style={{ gap: 0 }}
        onEscapeKeyDown={(e: { preventDefault: () => void }) => {
          e.preventDefault();
          composerRef.current?.requestClose();
        }}
        onInteractOutside={(e: { preventDefault: () => void }) => {
          e.preventDefault();
          composerRef.current?.requestClose();
        }}
      >
        <PostComposer
          ref={composerRef}
          post={post}
          open={open}
          onSave={onSave}
          onClose={handleClose}
          isLoading={isLoading}
          hashtagPool={hashtagPool}
          currentMonth={currentMonth}
          headerActions={
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          }
        />
      </TypedDialogContent>
    </Dialog>
  );
}
