import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PageLockPanel({ page, pageId, user }) {
  const queryClient = useQueryClient();
  const [lockReason, setLockReason] = useState('');

  const isLocked = page?.is_locked;
  const isMyLock = page?.locked_by === user?.email;
  const canUnlock = isMyLock || user?.role === 'admin';

  const lockMutation = useMutation({
    mutationFn: (lockData) => base44.entities.WikiPage.update(pageId, lockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
      setLockReason('');
    },
  });

  const handleLock = () => {
    lockMutation.mutate({
      is_locked: true,
      locked_by: user?.email,
      locked_at: new Date().toISOString(),
      lock_reason: lockReason || null,
    });
  };

  const handleUnlock = () => {
    lockMutation.mutate({
      is_locked: false,
      locked_by: null,
      locked_at: null,
      lock_reason: null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Page Lock</span>
        {isLocked && (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-xs">
            Locked
          </Badge>
        )}
      </div>

      {isLocked ? (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-700 dark:text-red-300">
                Locked by {page.locked_by?.split('@')[0]}
              </p>
              {page.locked_at && (
                <p className="text-xs text-red-500 mt-0.5">
                  {format(new Date(page.locked_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
              {page.lock_reason && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic">"{page.lock_reason}"</p>
              )}
            </div>
          </div>

          {canUnlock ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnlock}
              disabled={lockMutation.isPending}
              className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Unlock className="w-3.5 h-3.5" />
              Unlock Page
            </Button>
          ) : (
            <p className="text-xs text-red-500">Only the page owner or admin can unlock this page.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Lock reason (optional)</Label>
            <Input
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder="e.g. Under review, Final version..."
              className="text-sm h-8"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLock}
            disabled={lockMutation.isPending}
            className="w-full gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock Page
          </Button>
          <p className="text-xs text-gray-400">
            Locking prevents other users from editing this page.
          </p>
        </div>
      )}
    </div>
  );
}