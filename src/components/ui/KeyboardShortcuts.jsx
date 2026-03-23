import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open global search' },
  { keys: ['⌘', 'N'], description: 'Create new item' },
  { keys: ['⌘', 'S'], description: 'Save current form' },
  { keys: ['Esc'], description: 'Close modal / Cancel' },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
  { keys: ['⌘', 'E'], description: 'Export data' },
  { keys: ['←', '→'], description: 'Navigate pages' },
  { keys: ['⌘', 'D'], description: 'Toggle dark mode' },
];

export function useKeyboardShortcuts(handlers = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Global search: Cmd/Ctrl + K
      if (cmdKey && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
      }

      // New item: Cmd/Ctrl + N
      if (cmdKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handlers.onNew?.();
      }

      // Save: Cmd/Ctrl + S
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      }

      // Export: Cmd/Ctrl + E
      if (cmdKey && e.key === 'e') {
        e.preventDefault();
        handlers.onExport?.();
      }

      // Help: Cmd/Ctrl + /
      if (cmdKey && e.key === '/') {
        e.preventDefault();
        handlers.onHelp?.();
      }

      // Dark mode: Cmd/Ctrl + D
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        handlers.onToggleDarkMode?.();
      }

      // Escape
      if (e.key === 'Escape') {
        handlers.onEscape?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

export default function KeyboardShortcutsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">Use Ctrl instead of ⌘ on Windows/Linux</p>
      </DialogContent>
    </Dialog>
  );
}
