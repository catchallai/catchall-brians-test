import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useICCNotifications(user, channels) {
  const [unreadCounts, setUnreadCounts] = useState({});

  // Request desktop notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!user?.email) {
      return;
    }

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type !== 'create') {
        return;
      }

      const msg = event.data;
      const channel = channels?.find((c) => c.id === msg.channel_id);

      if (!channel || msg.sender_email === user.email) {
        return;
      }

      // Check if message mentions the user
      const isMention =
        msg.content?.includes(`@${user.full_name}`) ||
        msg.mentions?.includes(user.email) ||
        (msg.type === 'mention' && msg.mentioned_users?.includes(user.email));

      // Check if it's a direct message
      const isDM = channel.type === 'dm' && channel.members?.includes(user.email);

      if (isMention || isDM) {
        // Create notification in database
        createNotification({
          type: isMention ? 'mention' : 'direct_message',
          title: isMention
            ? `@${msg.sender_name} mentioned you`
            : `Message from ${msg.sender_name}`,
          body: msg.content?.substring(0, 100),
          channel_id: msg.channel_id,
          channel_name: channel.name,
          sender_email: msg.sender_email,
          sender_name: msg.sender_name,
          message_id: msg.id,
        });

        // Show in-app toast
        toast.info(
          isMention
            ? `🔔 ${msg.sender_name} mentioned you: ${msg.content?.substring(0, 60)}...`
            : `💬 ${msg.sender_name}: ${msg.content?.substring(0, 60)}...`
        );

        // Show desktop notification
        if (Notification.permission === 'granted') {
          new Notification(
            isMention ? `@${msg.sender_name} mentioned you` : `Message from ${msg.sender_name}`,
            {
              body: msg.content?.substring(0, 100),
              icon: '🔔',
              tag: `msg-${msg.id}`,
              requireInteraction: isMention,
            }
          );
        }

        // Update unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.channel_id]: (prev[msg.channel_id] || 0) + 1,
        }));
      }
    });

    return unsubscribe;
  }, [user, channels, toast]);

  const createNotification = useCallback(
    async (notificationData) => {
      try {
        await base44.entities.Notification.create({
          ...notificationData,
          user_email: user?.email,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    },
    [user?.email]
  );

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markChannelAsRead = useCallback(
    async (channelId) => {
      try {
        const notifications = await base44.entities.Notification.filter({
          channel_id: channelId,
          user_email: user?.email,
          is_read: false,
        });

        await Promise.all(
          notifications.map((n) => base44.entities.Notification.update(n.id, { is_read: true }))
        );

        setUnreadCounts((prev) => ({
          ...prev,
          [channelId]: 0,
        }));
      } catch (err) {
        console.error('Failed to mark channel as read:', err);
      }
    },
    [user?.email]
  );

  return {
    markAsRead,
    markChannelAsRead,
    unreadCounts,
  };
}
