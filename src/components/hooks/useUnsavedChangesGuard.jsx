import { useState, useRef } from 'react';

/**
 * useUnsavedChangesGuard — drop-in unsaved-changes guard for any modal.
 *
 * To add to a new modal:
 *  1. Compute isDirty (true when any field differs from its empty/initial state).
 *  2. const { guardedClose, markAsSubmitted, discardDialogProps } =
 *       useUnsavedChangesGuard({ isDirty, onClose });
 *  3. Replace <Dialog onOpenChange={onClose}> with onOpenChange={guardedClose}.
 *  4. Replace every onClick={onClose} Cancel button with onClick={guardedClose}.
 *  5. Call markAsSubmitted() immediately before the submit callback to bypass
 *     the guard when the parent closes the modal after a successful save.
 *  6. Render <ConfirmDialog {...discardDialogProps} /> inside the modal return.
 */
export default function useUnsavedChangesGuard({ isDirty, onClose }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const wasSubmitted = useRef(false);

  // Call this just before invoking the submit callback so that the
  // parent-triggered close (after a successful save) bypasses the guard.
  const markAsSubmitted = () => {
    wasSubmitted.current = true;
  };

  // Use as onOpenChange on <Dialog> and as onClick on Cancel buttons.
  // open=false means the user is attempting to close; open=true is a no-op.
  const guardedClose = (open) => {
    if (open) return;

    if (wasSubmitted.current || !isDirty) {
      wasSubmitted.current = false;
      onClose();
    } else {
      setShowConfirmDialog(true);
    }
  };

  const discardDialogProps = {
    open: showConfirmDialog,
    onClose: () => setShowConfirmDialog(false),
    onConfirm: () => {
      setShowConfirmDialog(false);
      onClose();
    },
    title: 'Discard changes?',
    description: 'You have unsaved changes. Are you sure you want to close without saving?',
    confirmLabel: 'Discard Changes',
    cancelLabel: 'Keep Editing',
    variant: 'destructive',
  };

  return { guardedClose, markAsSubmitted, discardDialogProps };
}
