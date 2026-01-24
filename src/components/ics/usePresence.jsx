import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const OFFLINE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const UPDATE_INTERVAL = 30 * 1000; // Update every 30 seconds

export function usePresence(user) {
  const [userPresence, setUserPresence] = useState(null);
  const [allPresence, setAllPresence] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and update user's presence
  const updatePresence = useCallback(async (status = 'online', inCall = false, callId = null) => {
    if (!user?.email) return;

    try {
      // Check if presence record exists
      const existing = await base44.entities.Presence.filter({ user_email: user.email });
      
      if (existing.length > 0) {
        // Update existing
        await base44.entities.Presence.update(existing[0].id, {
          status,
          in_call: inCall,
          call_id: callId,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new
        await base44.entities.Presence.create({
          user_email: user.email,
          user_name: user.full_name,
          status,
          in_call: inCall,
          call_id: callId,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setUserPresence({
        email: user.email,
        name: user.full_name,
        status,
        in_call: inCall,
        call_id: callId,
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Fetch all presence records
  const fetchAllPresence = useCallback(async () => {
    try {
      const presenceRecords = await base44.entities.Presence.list();
      const presenceMap = {};
      
      presenceRecords.forEach(record => {
        presenceMap[record.user_email] = {
          email: record.user_email,
          name: record.user_name,
          status: record.status,
          in_call: record.in_call,
          call_id: record.call_id,
        };
      });

      setAllPresence(presenceMap);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  }, []);

  // Initialize presence on mount
  useEffect(() => {
    if (!user?.email) return;

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
    events.forEach(event => document.addEventListener(event, handleActivity));

    return () => {
      clearInterval(updateInterval);
      clearTimeout(activityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach(event => document.removeEventListener(event, handleActivity));
      
      // Set offline on unmount
      updatePresence('offline', false);
    };
  }, [user?.email, updatePresence, fetchAllPresence]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = base44.entities.Presence.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setAllPresence(prev => ({
          ...prev,
          [event.data.user_email]: {
            email: event.data.user_email,
            name: event.data.user_name,
            status: event.data.status,
            in_call: event.data.in_call,
            call_id: event.data.call_id,
          },
        }));
      } else if (event.type === 'delete') {
        setAllPresence(prev => {
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