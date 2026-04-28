import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CalendarNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['calendar-notifications', user?.id],
    queryFn: () =>
      base44.entities.CalendarNotification.filter(
        { user_id: user.id, read: false },
        '-created_date',
        10
      ),
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.CalendarNotification.update(id, {
        read: true,
        read_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarNotification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-notifications'] });
    },
  });

  const notificationIcons = {
    upcoming_post: Clock,
    approval_request: AlertCircle,
    post_published: CheckCircle2,
  };

  const notificationColors = {
    upcoming_post: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    approval_request: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    post_published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
          <Badge className="bg-violet-600 dark:bg-violet-500 text-white">
            {notifications.length}
          </Badge>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || 'bg-gray-100 text-gray-700';

            return (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className="h-7 px-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    className="h-7 px-2 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
