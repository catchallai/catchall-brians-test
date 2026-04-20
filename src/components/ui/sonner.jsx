'use client';
import { useState, useEffect } from 'react';
import { Toaster as Sonner } from 'sonner';

// Read the app theme from localStorage (same key as ThemeProvider) so
// toasts stay in sync with the user's in-app toggle. The Toaster renders
// outside ThemeProvider in App.jsx, so we can't use the useTheme() hook.
const THEME_KEY = 'catchall-theme';

const Toaster = ({ ...props }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const handler = (/** @type {StorageEvent} */ e) => {
      if (e.key === THEME_KEY && e.newValue) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <Sonner
      theme={/** @type {'light' | 'dark'} */ (theme)}
      position="top-right"
      duration={5000}
      className="toaster group"
      style={{ zIndex: 100 }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success:
            'group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-800 group-[.toaster]:!border-emerald-200',
          error:
            'group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-800 group-[.toaster]:!border-red-200',
          warning:
            'group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-800 group-[.toaster]:!border-amber-200',
          info: 'group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-800 group-[.toaster]:!border-blue-200',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
