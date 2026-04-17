import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import COPY from '@/lib/copy';

interface NavigationGuard {
  /** Returns true if navigation should be blocked. */
  shouldBlock: () => boolean;
  /** Message to show in the confirmation prompt. */
  message: string;
}

type PendingNavigation = { type: 'url'; url: string } | { type: 'back' } | null;

interface NavigationGuardContextValue {
  /** Register a guard. Returns an unregister function. */
  register: (guard: NavigationGuard) => () => void;
  /** Check all guards — returns the first blocking message, or null if navigation is allowed. */
  check: () => string | null;
  /** Attempt a guarded navigation. If a guard blocks, show the confirm dialog.
   *  If no guard blocks, navigate immediately. */
  guardedNavigate: (url: string) => boolean;
  /** Attempt a guarded back navigation. Returns true if blocked. */
  guardedBack: () => boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  register: () => () => {},
  check: () => null,
  guardedNavigate: () => false,
  guardedBack: () => false,
});

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const guardsRef = useRef<Set<NavigationGuard>>(new Set());
  const [pending, setPending] = useState<PendingNavigation>(null);
  const [dialogMessage, setDialogMessage] = useState('');
  const navigate = useNavigate();

  const register = useCallback((guard: NavigationGuard) => {
    guardsRef.current.add(guard);
    return () => {
      guardsRef.current.delete(guard);
    };
  }, []);

  const check = useCallback(() => {
    for (const guard of guardsRef.current) {
      if (guard.shouldBlock()) return guard.message;
    }
    return null;
  }, []);

  /** Returns true if navigation was blocked (dialog shown). Returns false if
   *  no guard is active — the caller should proceed with its own navigation
   *  (e.g. let a Link's `to` prop handle it). */
  const guardedNavigate = useCallback(
    (url: string) => {
      const message = check();
      if (message) {
        setDialogMessage(message);
        setPending({ type: 'url', url });
        return true; // blocked — dialog will handle navigation on confirm
      }
      return false; // not blocked — caller handles navigation
    },
    [check]
  );

  const guardedBack = useCallback(() => {
    const message = check();
    if (message) {
      setDialogMessage(message);
      setPending({ type: 'back' });
      return true; // blocked
    }
    return false;
  }, [check]);

  const handleConfirm = () => {
    const nav = pending;
    setPending(null);
    setDialogMessage('');
    if (nav?.type === 'url') {
      navigate(nav.url);
    } else if (nav?.type === 'back') {
      window.history.back();
    }
  };

  const handleCancel = () => {
    setPending(null);
    setDialogMessage('');
  };

  return (
    <NavigationGuardContext.Provider value={{ register, check, guardedNavigate, guardedBack }}>
      {children}
      <ConfirmDialog
        open={!!pending}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={COPY.socialCalendar.discardChangesTitle}
        description={dialogMessage}
        confirmLabel={COPY.socialCalendar.discardViewSwitchConfirm}
        cancelLabel={COPY.socialCalendar.keepEditing}
        variant="destructive"
      />
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
