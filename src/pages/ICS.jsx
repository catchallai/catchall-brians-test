import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useICCNotifications } from '@/components/ics/useICCNotifications';
import NotificationAlert from '@/components/ics/NotificationAlert';

import { usePresence } from '@/components/ics/usePresence';
import Sidebar from '@/components/ics/Sidebar';
import ConversationsList from '@/components/ics/ConversationsList';
import ChatArea from '@/components/ics/ChatArea';
import UsersList from '@/components/ics/UsersList';
import NotificationsView from '@/components/ics/NotificationsView';
import ArchivedList from '@/components/ics/ArchivedList';
import SettingsPanel from '@/components/ics/SettingsPanel';
import NotificationPreferences from '@/components/notifications/NotificationPreferences.jsx';
import { playNotificationSound, isInDND } from '@/components/notifications/NotificationSounds';
import {
  extractMentions,
  createMentionNotifications,
} from '@/components/notifications/MentionParser';
import ICSAdminPortal from '@/components/ics/ICSAdminPortal.jsx';
import ContactDetailPanel from '@/components/ics/ContactDetailPanel';
import IncomingCallNotification from '@/components/ics/IncomingCallNotification';
import NewChannelModal from '@/components/ics/NewChannelModal';
import MeetingsView from '@/components/ics/MeetingsView';
import ChannelBrowser from '@/components/ics/ChannelBrowser';

export default function ICS() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [_showProfile, setShowProfile] = useState(false);
  const [_isInCall, setIsInCall] = useState(false);
  const [typingByChannel, _setTypingByChannel] = useState({});
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [clickedNotification, setClickedNotification] = useState(null);
  const [_newChannelName, setNewChannelName] = useState('');
  const [_newChannelDesc, setNewChannelDesc] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { userPresence, allPresence, updatePresence } = usePresence(user);

  // Load notification preferences
  const { data: prefsData } = useQuery({
    queryKey: ['notification-prefs', user?.email],
    queryFn: async () => {
      if (!user) {
        return null;
      }
      const records = await base44.entities.NotificationPreference.filter({
        user_email: user.email,
      });
      return records[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (prefsData) {
      setNotificationPrefs(prefsData);
    }
  }, [prefsData]);

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const allChannels = await base44.entities.Channel.list();
      return allChannels.filter(
        (c) => !c.is_archived && (c.type === 'public' || c.members?.includes(user?.email))
      );
    },
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date', 500);
      return users.filter((u) => u.email !== user?.email);
    },
    enabled: !!user,
  });

  const { data: archivedChannels = [] } = useQuery({
    queryKey: ['archived-channels'],
    queryFn: async () => {
      const allChannels = await base44.entities.Channel.list();
      return allChannels.filter((c) => c.is_archived);
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) {
        return [];
      }
      const allMessages = await base44.entities.Message.list();
      return allMessages
        .filter((m) => m.channel_id === selectedChannel.id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!selectedChannel,
    refetchInterval: 5000,
  });

  const { markChannelAsRead, unreadCounts } = useICCNotifications(user, channels);

  // Handle notification click - navigate to channel
  useEffect(() => {
    if (clickedNotification) {
      const channel = channels?.find((c) => c.id === clickedNotification.channel_id);
      if (channel) {
        setSelectedChannel(channel);
        markChannelAsRead(clickedNotification.channel_id);
        setActiveView('chat');
        setClickedNotification(null);
      }
    }
  }, [clickedNotification, channels, markChannelAsRead]);

  const { data: activeCall } = useQuery({
    queryKey: ['active-call', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) {
        return null;
      }
      const calls = await base44.entities.VideoCall.list();
      return (
        calls.find((c) => c.channel_id === selectedChannel.id && c.status === 'active') || null
      );
    },
    enabled: !!selectedChannel,
    refetchInterval: 10000,
  });

  // Monitor for incoming calls
  const { data: incomingCallData } = useQuery({
    queryKey: ['incoming-calls', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return null;
      }
      const calls = await base44.entities.VideoCall.list();
      // Find active calls where user is in waiting_room or a participant
      return (
        calls.find(
          (c) =>
            c.status === 'active' &&
            !c.participants?.some((p) => p.email === user?.email) &&
            c.waiting_room?.some((w) => w.email === user?.email)
        ) || null
      );
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (incomingCallData && !incomingCall) {
      setIncomingCall(incomingCallData);
    }
  }, [incomingCallData, incomingCall]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedChannel) {
      return;
    }

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data.channel_id === selectedChannel.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedChannel.id] });
      }
    });

    return unsubscribe;
  }, [selectedChannel, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createChannelMutation = useMutation({
    mutationFn: (data) => base44.entities.Channel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowNewChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      // Handle mentions
      const mentionedEmails = extractMentions(
        newMessage.content,
        channels.flatMap((c) => c.members)
      );
      if (mentionedEmails.length > 0) {
        createMentionNotifications(base44, newMessage, mentionedEmails);
      }

      // Trigger notification for new messages from others
      if (newMessage.sender_email !== user?.email && notificationPrefs) {
        const isMuted = notificationPrefs.muted_channels?.includes(selectedChannel?.id);
        const inDND = isInDND(notificationPrefs.dnd_start_time, notificationPrefs.dnd_end_time);

        if (!isMuted && (!inDND || !notificationPrefs.do_not_disturb_enabled)) {
          if (notificationPrefs.messages_enabled && notificationPrefs.sound_enabled) {
            playNotificationSound(notificationPrefs.sound_type);
          }

          if (notificationPrefs.desktop_notifications_enabled) {
            try {
              new Notification(`New message from ${newMessage.sender_name}`, {
                body: newMessage.content.substring(0, 100),
                icon: '/logo.png',
                tag: 'new-message',
              });
            } catch (_err) {
              console.warn('Desktop notifications not supported');
            }
          }
        }
      }
    },
  });

  const startCallMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-call'] });
      setIsInCall(true);
    },
  });

  const endCallMutation = useMutation({
    mutationFn: (callId) =>
      base44.entities.VideoCall.update(callId, {
        status: 'ended',
        ended_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-call', selectedChannel?.id] });
      setIsInCall(false);
    },
  });

  const updateCallMutation = useMutation({
    mutationFn: ({ callId, data }) => base44.entities.VideoCall.update(callId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-call'] });
    },
  });

  const admitFromWaitingRoomMutation = useMutation({
    mutationFn: async ({ callId, userEmail, userName }) => {
      const waitingRoom = activeCall?.waiting_room?.filter((u) => u.email !== userEmail) || [];
      const participants = [
        ...(activeCall?.participants || []),
        {
          email: userEmail,
          name: userName,
          joined_at: new Date().toISOString(),
        },
      ];
      return base44.entities.VideoCall.update(callId, {
        waiting_room: waitingRoom,
        participants,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-call'] });
    },
  });

  const handleSendMessage = (messageData) => {
    if (!selectedChannel) {
      return;
    }

    sendMessageMutation.mutate({
      channel_id: selectedChannel.id,
      content: messageData.content,
      sender_email: user?.email,
      sender_name: user?.full_name,
      attachments: messageData.attachments,
    });
  };

  const handlePreferencesUpdate = (updatedPrefs) => {
    setNotificationPrefs(updatedPrefs);
    queryClient.invalidateQueries({ queryKey: ['notification-prefs'] });
  };

  const handleStartCall = () => {
    const roomId = `call-${selectedChannel.id}-${Date.now()}`;
    updatePresence('online', true, roomId);

    // Get other members of the channel for waiting room
    const otherMembers = selectedChannel?.members?.filter((m) => m !== user?.email) || [];
    const waitingRoom = otherMembers.map((email) => {
      const member = allUsers.find((u) => u.email === email);
      return {
        email,
        name: member?.full_name || email,
        requested_at: new Date().toISOString(),
      };
    });

    startCallMutation.mutate({
      channel_id: selectedChannel.id,
      room_id: roomId,
      host_email: user?.email,
      started_by: user?.email,
      started_at: new Date().toISOString(),
      participants: [
        {
          email: user?.email,
          name: user?.full_name,
          joined_at: new Date().toISOString(),
          is_screen_sharing: false,
        },
      ],
      waiting_room: waitingRoom,
      recording_status: 'not_started',
      recording_started_at: null,
      settings: {
        waiting_room_enabled: false,
        allow_screen_share: true,
        auto_record: false,
      },
    });
  };

  const handleAcceptCall = async (_callType = 'video') => {
    if (!incomingCall || !user) {
      return;
    }

    // Add current user to participants
    const updatedParticipants = [
      ...incomingCall.participants,
      {
        email: user.email,
        name: user.full_name,
        joined_at: new Date().toISOString(),
      },
    ];

    // Remove from waiting room
    const updatedWaitingRoom =
      incomingCall.waiting_room?.filter((w) => w.email !== user.email) || [];

    await base44.entities.VideoCall.update(incomingCall.id, {
      participants: updatedParticipants,
      waiting_room: updatedWaitingRoom,
    });

    // Find or create the channel and set it as active
    const callChannel = channels.find((c) => c.id === incomingCall.channel_id);
    if (callChannel) {
      setSelectedChannel(callChannel);
      setActiveView('chat');
    }

    setIncomingCall(null);
    queryClient.invalidateQueries({ queryKey: ['active-call'] });
  };

  const handleDeclineCall = async () => {
    if (!incomingCall || !user) {
      return;
    }

    // Just remove from waiting room
    const updatedWaitingRoom =
      incomingCall.waiting_room?.filter((w) => w.email !== user.email) || [];

    await base44.entities.VideoCall.update(incomingCall.id, {
      waiting_room: updatedWaitingRoom,
    });

    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (activeCall) {
      updatePresence('online', false);
      endCallMutation.mutate(activeCall.id);
    }
  };

  const handleToggleRecording = () => {
    if (!activeCall) {
      return;
    }
    const newStatus = activeCall.recording_status === 'recording' ? 'paused' : 'recording';
    updateCallMutation.mutate({
      callId: activeCall.id,
      data: {
        recording_status: newStatus,
        recording_started_at:
          newStatus === 'recording' && !activeCall.recording_started_at
            ? new Date().toISOString()
            : activeCall.recording_started_at,
      },
    });
  };

  const handleAdmitUser = (userEmail, userName) => {
    if (!activeCall) {
      return;
    }
    admitFromWaitingRoomMutation.mutate({
      callId: activeCall.id,
      userEmail,
      userName,
    });
  };

  const handleRejectUser = (userEmail) => {
    if (!activeCall) {
      return;
    }
    const updatedWaitingRoom = activeCall.waiting_room?.filter((u) => u.email !== userEmail) || [];
    updateCallMutation.mutate({
      callId: activeCall.id,
      data: { waiting_room: updatedWaitingRoom },
    });
  };

  const handleToggleWaitingRoom = () => {
    if (!activeCall) {
      return;
    }
    updateCallMutation.mutate({
      callId: activeCall.id,
      data: {
        settings: {
          ...activeCall.settings,
          waiting_room_enabled: !activeCall.settings?.waiting_room_enabled,
        },
      },
    });
  };

  const { data: typingStatus = {} } = useQuery({
    queryKey: ['typing-status', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) {
        return {};
      }
      const typingRecords = await base44.entities.Presence.filter({
        channel_id: selectedChannel.id,
        is_typing: true,
      });
      const result = {};
      if (typingRecords && typingRecords.length > 0) {
        typingRecords.forEach((record) => {
          result[record.user_email] = record.user_name;
        });
      }
      return result;
    },
    enabled: !!selectedChannel,
    refetchInterval: 2000,
  });

  // Subscribe to typing status
  useEffect(() => {
    if (!selectedChannel) {
      return;
    }

    const unsubscribe = base44.entities.Presence.subscribe((event) => {
      if (event.data.channel_id === selectedChannel.id) {
        queryClient.invalidateQueries({ queryKey: ['typing-status', selectedChannel.id] });
      }
    });

    return unsubscribe;
  }, [selectedChannel, queryClient]);

  const handleTyping = async (isTyping) => {
    if (!selectedChannel || !user) {
      return;
    }

    try {
      const presenceRecords = await base44.entities.Presence.filter({
        user_email: user.email,
        channel_id: selectedChannel.id,
      });

      if (presenceRecords.length > 0) {
        await base44.entities.Presence.update(presenceRecords[0].id, {
          is_typing: isTyping,
        });
      } else {
        await base44.entities.Presence.create({
          user_email: user.email,
          user_name: user.full_name,
          channel_id: selectedChannel.id,
          is_typing: isTyping,
          status: 'online',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['typing-status', selectedChannel.id] });
    } catch (err) {
      console.error('Error updating typing status:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Real-time notification alert */}
      <NotificationAlert user={user} onNotificationClick={setClickedNotification} />

      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onSettingsClick={() => setShowSettings(true)}
        onAccountClick={() => setActiveView('account')}
        user={user}
        unreadCount={Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
        onNewChannel={() => setShowNewChannel(true)}
      />

      <div className="flex flex-1 min-h-0">
      {activeView === 'chat' ? (
        <>
          <ConversationsList
            channels={channels}
            selectedChannelId={selectedChannel?.id}
            onSelectChannel={setSelectedChannel}
            onNewChat={() => setShowNewChannel(true)}
            allPresence={allPresence}
            typingByChannel={typingByChannel}
            unreadCounts={unreadCounts}
          />

          <ChatArea
            channel={selectedChannel}
            user={user}
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartCall={handleStartCall}
            onShowProfile={() => setShowProfile(true)}
            typingUsers={Object.values(typingStatus).filter((name) => name !== user?.full_name)}
            onTyping={handleTyping}
            activeCall={activeCall}
            onEndCall={handleEndCall}
            onToggleRecording={handleToggleRecording}
            onToggleWaitingRoom={handleToggleWaitingRoom}
            onAdmitUser={handleAdmitUser}
            onRejectUser={handleRejectUser}
            updateCallMutation={updateCallMutation}
          />
        </>
      ) : activeView === 'contacts' ? (
        <>
          <UsersList
            users={allUsers}
            allPresence={allPresence}
            currentUser={user}
            onViewProfile={(contact) => {
              setSelectedContact(contact);
              setShowContactPanel(true);
            }}
          />

          <ContactDetailPanel
            contact={selectedContact}
            presence={selectedContact ? allPresence[selectedContact.email] : null}
            isOpen={showContactPanel}
            onClose={() => {
              setShowContactPanel(false);
              setSelectedContact(null);
            }}
            onDirectMessage={(contact) => {
              const dmChannel = channels.find(
                (c) =>
                  c.type === 'dm' &&
                  c.members?.includes(contact.email) &&
                  c.members?.includes(user?.email)
              );

              if (dmChannel) {
                setSelectedChannel(dmChannel);
                setShowContactPanel(false);
                setActiveView('chat');
              } else {
                createChannelMutation.mutate({
                  name: contact.full_name,
                  type: 'dm',
                  created_by: user?.email,
                  members: [user?.email, contact.email],
                  last_activity: new Date().toISOString(),
                });
                setShowContactPanel(false);
              }
            }}
            onVideoCall={(contact) => {
              const dmChannel = channels.find(
                (c) =>
                  c.type === 'dm' &&
                  c.members?.includes(contact.email) &&
                  c.members?.includes(user?.email)
              );

              if (dmChannel) {
                setSelectedChannel(dmChannel);
                handleStartCall();
              }
              setShowContactPanel(false);
            }}
            onGroupMessage={() => {}}
            onScheduleCall={() => {}}
            isOwnProfile={false}
          />
        </>
      ) : activeView === 'account' ? (
        <ContactDetailPanel
          contact={user}
          presence={userPresence}
          isOpen={true}
          onClose={() => setActiveView('chat')}
          onDirectMessage={() => {}}
          onVideoCall={() => {}}
          onGroupMessage={() => {}}
          onScheduleCall={() => {}}
          isOwnProfile={true}
        />
      ) : activeView === 'notifications' ? (
        <NotificationsView user={user} />
      ) : activeView === 'archived' ? (
        <ArchivedList
          channels={archivedChannels}
          onSelectChannel={(channel) => {
            setSelectedChannel(channel);
            setActiveView('chat');
          }}
        />
      ) : activeView === 'meetings' ? (
        <MeetingsView user={user} channels={channels} />
      ) : activeView === 'browse' ? (
        <ChannelBrowser
          currentUser={user}
          onSelectChannel={(ch) => { setSelectedChannel(ch); setActiveView('chat'); }}
          onClose={() => setActiveView('chat')}
        />
      ) : activeView === 'admin' ? (
        <div className="flex-1 overflow-auto">
          <ICSAdminPortal />
        </div>
      ) : null}
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        onPreferencesUpdate={handlePreferencesUpdate}
      />

      {/* New Channel Modal */}
      <NewChannelModal
        open={showNewChannel}
        onClose={() => setShowNewChannel(false)}
        onCreateChannel={(data) => {
          createChannelMutation.mutate(data);
          setShowNewChannel(false);
        }}
        allUsers={allUsers}
        currentUser={user}
      />

      {/* Incoming Call Notification */}
      <IncomingCallNotification
        call={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    </div>
  );
}