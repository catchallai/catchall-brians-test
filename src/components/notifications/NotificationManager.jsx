import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, AlertCircle } from 'lucide-react';

export default function NotificationManager({ user }) {
  const [dndActive, setDndActive] = useState(false);

  // Check if DND is active
  useEffect(() => {
    if (!user?.do_not_disturb_enabled) {
      setDndActive(false);
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const startTime = user.dnd_start_time || '22:00';
    const endTime = user.dnd_end_time || '08:00';

    // Handle case where DND spans midnight
    if (startTime > endTime) {
      setDndActive(currentTime >= startTime || currentTime < endTime);
    } else {
      setDndActive(currentTime >= startTime && currentTime < endTime);
    }
  }, [user]);

  // Fetch notifications for current user
  const { data: fetchedNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () =>
      base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 50),
    refetchInterval: 5000,
    enabled: !!user?.email,
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.email) {
      return;
    }

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_email === user.email) {
        const notification = event.data;

        // Check if this is a mention notification and user has mentions enabled
        const isMention = notification.type === 'mention';
        if (isMention && !user?.mentions_enabled) {
          return;
        }

        // Show notification if not in DND
        if (!dndActive && user?.desktop_notifications_enabled) {
          showDesktopNotification(notification);
        }

        // Play sound if enabled and not in DND
        if (!dndActive && user?.sound_enabled) {
          playNotificationSound();
        }
      }
    });

    return unsubscribe;
  }, [user, dndActive]);

  const showDesktopNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '✨',
      });
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const markAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { is_read: true });
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {dndActive && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            Do Not Disturb is active until {user?.dnd_end_time}
          </div>
        </div>
      )}

      {fetchedNotifications.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        fetchedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border transition-colors ${
              notification.is_read
                ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {notification.title}
                  </h4>
                  {notification.type === 'mention' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      @mention
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.body}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500">
                    {notification.actor_name && `By ${notification.actor_name}`}
                  </p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
              >
                {notification.is_read ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
