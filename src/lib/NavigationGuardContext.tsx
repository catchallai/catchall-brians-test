import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  /** Attempt a guarded navigation. If a guard blocks, show the confirm dialog
   *  and return true. If no guard blocks, return false so the caller can
   *  perform navigation itself (e.g. let a Link's `to` prop handle it). */
  guardedNavigate: (url: string) => boolean;
  /** Attempt a guarded back navigation. If a guard blocks, show the confirm
   *  dialog and return true. If no guard blocks, return false so the caller
   *  can perform the back navigation itself.
   *  `onBeforeNavigate` is called just before `history.back()` on confirm,
   *  allowing the caller to set a bypass ref so its own popstate handler
   *  doesn't re-block the confirmed navigation. */
  guardedBack: (onBeforeNavigate?: () => void) => boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

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

  const beforeNavigateRef = useRef<(() => void) | null>(null);

  const guardedBack = useCallback(
    (onBeforeNavigate?: () => void) => {
      const message = check();
      if (message) {
        setDialogMessage(message);
        setPending({ type: 'back' });
        beforeNavigateRef.current = onBeforeNavigate ?? null;
        return true; // blocked
      }
      return false;
    },
    [check]
  );

  const handleConfirm = () => {
    const nav = pending;
    const beforeNavigate = beforeNavigateRef.current;
    setPending(null);
    setDialogMessage('');
    beforeNavigateRef.current = null;
    if (nav?.type === 'url') {
      navigate(nav.url);
    } else if (nav?.type === 'back') {
      // Call the caller's cleanup before navigating so it can set a bypass
      // ref to prevent its own popstate handler from re-blocking.
      beforeNavigate?.();
      window.history.back();
    }
  };

  const handleCancel = () => {
    setPending(null);
    setDialogMessage('');
    beforeNavigateRef.current = null;
  };

  return (
    <NavigationGuardContext.Provider
      value={useMemo(
        () => ({ register, check, guardedNavigate, guardedBack }),
        [register, check, guardedNavigate, guardedBack]
      )}
    >
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
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error('useNavigationGuard must be used within a NavigationGuardProvider');
  }
  return ctx;
}
