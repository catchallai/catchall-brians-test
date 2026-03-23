import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, EyeOff, Bell, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PageWatchersPanel({ pageId, user }) {
  const queryClient = useQueryClient();

  const { data: watchers = [] } = useQuery({
    queryKey: ['page-watchers', pageId],
    queryFn: async () => {
      const allWatchers = await base44.entities.WikiPageWatcher.list();
      return allWatchers.filter((w) => w.page_id === pageId);
    },
    enabled: !!pageId,
  });

  const { data: currentUserWatcher } = useQuery({
    queryKey: ['user-watching', pageId, user?.email],
    queryFn: async () => {
      const allWatchers = await base44.entities.WikiPageWatcher.list();
      return allWatchers.find((w) => w.page_id === pageId && w.user_email === user?.email);
    },
    enabled: !!pageId && !!user,
  });

  const watchMutation = useMutation({
    mutationFn: async (watchData) => {
      if (currentUserWatcher) {
        return await base44.entities.WikiPageWatcher.update(currentUserWatcher.id, watchData);
      } else {
        return await base44.entities.WikiPageWatcher.create({
          page_id: pageId,
          user_email: user.email,
          ...watchData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-watchers', pageId] });
      queryClient.invalidateQueries({ queryKey: ['user-watching', pageId] });
      // Update watcher count on page
      base44.entities.WikiPage.update(pageId, {
        watchers_count: watchers.length + (currentUserWatcher ? 0 : 1),
      });
    },
  });

  const unwatchMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.WikiPageWatcher.delete(currentUserWatcher.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-watchers', pageId] });
      queryClient.invalidateQueries({ queryKey: ['user-watching', pageId] });
      // Update watcher count on page
      base44.entities.WikiPage.update(pageId, { watchers_count: Math.max(0, watchers.length - 1) });
    },
  });

  const toggleWatch = () => {
    if (currentUserWatcher) {
      unwatchMutation.mutate();
    } else {
      watchMutation.mutate({
        notify_on_edit: true,
        notify_on_comment: true,
      });
    }
  };

  const isWatching = !!currentUserWatcher;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {watchers.length} {watchers.length === 1 ? 'Watcher' : 'Watchers'}
          </span>
        </div>
        <Button
          variant={isWatching ? 'default' : 'outline'}
          size="sm"
          onClick={toggleWatch}
          className="gap-2"
        >
          {isWatching ? (
            <>
              <EyeOff className="w-4 h-4" />
              Unwatch
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Watch
            </>
          )}
        </Button>
      </div>

      {isWatching && (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Notification Settings
          </p>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-edit" className="text-sm cursor-pointer flex items-center gap-2">
              <Bell className="w-3 h-3" />
              On page edits
            </Label>
            <Switch
              id="notify-edit"
              checked={currentUserWatcher?.notify_on_edit ?? true}
              onCheckedChange={(checked) => watchMutation.mutate({ notify_on_edit: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="notify-comment"
              className="text-sm cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="w-3 h-3" />
              On new comments
            </Label>
            <Switch
              id="notify-comment"
              checked={currentUserWatcher?.notify_on_comment ?? true}
              onCheckedChange={(checked) => watchMutation.mutate({ notify_on_comment: checked })}
            />
          </div>
        </div>
      )}

      {watchers.length > 0 && (
        <div className="space-y-2">
          {watchers.slice(0, 5).map((watcher) => (
            <div key={watcher.id} className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-600">
                  {watcher.user_email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {watcher.user_email.split('@')[0]}
              </span>
            </div>
          ))}
          {watchers.length > 5 && (
            <p className="text-xs text-gray-500">+{watchers.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}
