import { useState } from 'react';

/**
 * useUnsavedChangesGuard — drop-in unsaved-changes guard for any modal.
 *
 * To add to a new modal:
 *  1. Compute isDirty (true when any field differs from its empty/initial state).
 *  2. const { guardedClose, discardDialogProps } = useUnsavedChangesGuard({ isDirty, onClose });
 *  3. Replace <Dialog onOpenChange={onClose}> with onOpenChange={guardedClose}.
 *  4. Replace every onClick={onClose} Cancel button with onClick={() => guardedClose(false)}.
 *  5. After a successful save that should close immediately, call
 *     guardedClose({ open: false, bypass: true }).
 *  6. Render <ConfirmDialog {...discardDialogProps} /> inside the modal return.
 */
export default function useUnsavedChangesGuard({ isDirty, onClose }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Use as onOpenChange on <Dialog> and as onClick on Cancel buttons.
  // open=false means the user is attempting to close; open=true is a no-op.
  const guardedClose = (arg) => {
    if (arg?.preventDefault && arg?.stopPropagation) {
      arg.preventDefault();
      return;
    }

    const open = typeof arg === 'boolean' ? arg : arg?.open;
    const bypass = typeof arg === 'boolean' ? false : Boolean(arg?.bypass);

    if (open) {
      return;
    }

    if (bypass || !isDirty) {
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

  return { guardedClose, discardDialogProps };
}
