import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const UPDATE_INTERVAL = 60 * 1000; // Update every 60 seconds

export function usePresence(user) {
  const [userPresence, setUserPresence] = useState(null);
  const [allPresence, setAllPresence] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and update user's presence
  const updatePresence = useCallback(
    async (status = 'online', inCall = false, callId = null, customStatus = null) => {
      if (!user?.email) {
        return;
      }

      try {
        // Check if presence record exists
        const existing = await base44.entities.Presence.filter({ user_email: user.email });

        const updateData = {
          status,
          in_call: inCall,
          call_id: callId,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(customStatus && {
            custom_status: customStatus.custom_status,
            status_emoji: customStatus.status_emoji,
            status_expires_at: customStatus.status_expires_at || null,
            dnd_enabled: customStatus.dnd_enabled || false,
            dnd_expires_at: customStatus.dnd_expires_at || null,
            away_message: customStatus.away_message || '',
          }),
        };

        if (existing.length > 0) {
          // Update existing
          await base44.entities.Presence.update(existing[0].id, updateData);
        } else {
          // Create new
          await base44.entities.Presence.create({
            user_email: user.email,
            user_name: user.full_name,
            ...updateData,
          });
        }

        setUserPresence({
          email: user.email,
          name: user.full_name,
          status,
          in_call: inCall,
          call_id: callId,
          custom_status: customStatus?.custom_status || '',
          status_emoji: customStatus?.status_emoji || '',
          dnd_enabled: customStatus?.dnd_enabled || false,
          away_message: customStatus?.away_message || '',
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    },
    [user]
  );

  // Fetch all presence records
  const fetchAllPresence = useCallback(async () => {
    try {
      const presenceRecords = await base44.entities.Presence.list();
      const presenceMap = {};

      presenceRecords.forEach((record) => {
        // Check if status or DND has expired
        const now = new Date();
        const activeStatus = record.status;
        let customStatus = record.custom_status;
        let statusEmoji = record.status_emoji;
        let dndEnabled = record.dnd_enabled;

        if (record.status_expires_at && new Date(record.status_expires_at) < now) {
          customStatus = '';
          statusEmoji = '';
        }

        if (record.dnd_expires_at && new Date(record.dnd_expires_at) < now) {
          dndEnabled = false;
        }

        presenceMap[record.user_email] = {
          email: record.user_email,
          name: record.user_name,
          status: activeStatus,
          in_call: record.in_call,
          call_id: record.call_id,
          custom_status: customStatus,
          status_emoji: statusEmoji,
          dnd_enabled: dndEnabled,
          away_message: dndEnabled ? record.away_message : '',
        };
      });

      setAllPresence(presenceMap);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  }, []);

  // Initialize presence on mount
  useEffect(() => {
    if (!user?.email) {
      return;
    }

    const initialize = async () => {
      setIsLoading(true);
      await updatePresence('online', false);
      await fetchAllPresence();
      setIsLoading(false);
    };

    initialize();

    // Set up periodic update
    const updateInterval = setInterval(() => {
      updatePresence('online', false);
      fetchAllPresence();
    }, UPDATE_INTERVAL);

    // Handle visibility change (away when tab is hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away', false);
      } else {
        updatePresence('online', false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle activity
    let activityTimeout;
    const handleActivity = () => {
      clearTimeout(activityTimeout);
      updatePresence('online', false);

      activityTimeout = setTimeout(() => {
        updatePresence('away', false);
      }, AWAY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => document.addEventListener(event, handleActivity));

    return () => {
      clearInterval(updateInterval);
      clearTimeout(activityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach((event) => document.removeEventListener(event, handleActivity));

      // Set offline on unmount
      updatePresence('offline', false);
    };
  }, [user?.email, updatePresence, fetchAllPresence]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!user?.email) {
      return;
    }

    const unsubscribe = base44.entities.Presence.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setAllPresence((prev) => ({
          ...prev,
          [event.data.user_email]: {
            email: event.data.user_email,
            name: event.data.user_name,
            status: event.data.status,
            in_call: event.data.in_call,
            call_id: event.data.call_id,
            custom_status: event.data.custom_status,
            status_emoji: event.data.status_emoji,
            dnd_enabled: event.data.dnd_enabled,
            away_message: event.data.away_message,
          },
        }));
      } else if (event.type === 'delete') {
        setAllPresence((prev) => {
          const updated = { ...prev };
          delete updated[event.id];
          return updated;
        });
      }
    });

    return unsubscribe;
  }, [user?.email]);

  return {
    userPresence,
    allPresence,
    isLoading,
    updatePresence,
    getPresence: (email) => allPresence[email] || null,
  };
}
