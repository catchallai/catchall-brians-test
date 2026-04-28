import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Trash2, CheckCircle2, Circle, Moon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotificationPreferences from './NotificationPreferences';

const typeColors = {
  message: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  mention: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  update: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  contact_added: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  deal_update: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  project_update: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  task_assigned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  comment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  system: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export default function NotificationCenter({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showRead, setShowRead] = useState(false);
  const [dndActive, setDndActive] = useState(false);
  const queryClient = useQueryClient();

  // Check if in Do Not Disturb window
  useEffect(() => {
    const checkDND = async () => {
      if (!user?.email) {
        return;
      }
      try {
        const prefs = await base44.entities.NotificationPreference.filter({
          user_email: user.email,
        });
        if (prefs[0]?.do_not_disturb_enabled) {
          const now = new Date();
          const startTime = prefs[0].dnd_start_time || '22:00';
          const endTime = prefs[0].dnd_end_time || '08:00';
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);

          const startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            startHour,
            startMin
          );
          const endDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            endHour,
            endMin
          );

          if (startDate > endDate) {
            endDate.setDate(endDate.getDate() + 1);
          }

          setDndActive(now >= startDate && now <= endDate);
        }
      } catch (err) {
        console.error('Failed to check DND:', err);
      }
    };

    checkDND();
    const interval = setInterval(checkDND, 60000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email, showRead],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      const query = { user_email: user.email };
      if (!showRead) {
        query.is_read = false;
      }
      return await base44.entities.Notification.filter(query, '-created_date', 50);
    },
    enabled: !!user && isOpen,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    filterType === 'all' ? notifications : notifications.filter((n) => n.type === filterType);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {dndActive && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 rounded-full border border-white dark:border-gray-900"
              title="Do Not Disturb active"
            />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              Notification Center
              {dndActive && (
                <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Moon className="w-3 h-3" /> DND Active
                </span>
              )}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-full text-xs font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </DialogTitle>
            <NotificationPreferences user={user} />
          </div>
        </DialogHeader>

        <div className="flex gap-2 pb-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="mention">Mentions</SelectItem>
              <SelectItem value="update">Updates</SelectItem>
              <SelectItem value="deal_update">Deals</SelectItem>
              <SelectItem value="project_update">Projects</SelectItem>
              <SelectItem value="task_assigned">Tasks</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="contact_added">Contacts</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showRead ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowRead(!showRead)}
            className="text-xs"
          >
            {showRead ? 'Unread' : 'All'}
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 transition-all ${
                    notification.is_read
                      ? 'bg-slate-50 dark:bg-slate-900 border-l-slate-300 dark:border-l-slate-700'
                      : 'bg-blue-50 dark:bg-blue-950 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${typeColors[notification.type]}`}
                        >
                          {notification.type.replace('_', ' ')}
                        </span>
                        {notification.actor_name && (
                          <span className="text-xs text-muted-foreground">
                            {notification.actor_name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm break-words">{notification.title}</h3>
                      {notification.body && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_date), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          title="Mark as read"
                        >
                          <Circle className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {notification.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Mark as unread"
                          onClick={() =>
                            base44.entities.Notification.update(notification.id, {
                              is_read: false,
                              read_at: null,
                            }).then(() =>
                              queryClient.invalidateQueries({ queryKey: ['notifications'] })
                            )
                          }
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
