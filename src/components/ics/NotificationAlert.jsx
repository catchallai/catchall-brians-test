import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, AtSign, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationAlert({ user, onNotificationClick }) {
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    if (!user?.email) {
      return;
    }
    loadRecentNotifications();
    const interval = setInterval(loadRecentNotifications, 5000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const loadRecentNotifications = async () => {
    try {
      const notifications = await base44.entities.Notification.filter({
        user_email: user?.email,
        is_read: false,
      });

      // Only show last 3 unread notifications
      setRecentNotifications(notifications.slice(0, 3));
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const dismissNotification = async (notifId) => {
    try {
      await base44.entities.Notification.update(notifId, { is_read: true });
      setRecentNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  if (recentNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 space-y-3 max-w-sm z-50">
      {recentNotifications.map((notif) => {
        const Icon = notif.type === 'mention' ? AtSign : MessageSquare;
        const bgColor =
          notif.type === 'mention' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';

        return (
          <Card key={notif.id} className={`p-4 border shadow-lg ${bgColor}`}>
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-current mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.body}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onNotificationClick?.(notif);
                dismissNotification(notif.id);
              }}
              className="mt-3 w-full text-xs"
            >
              View
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
