import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Video, 
  Phone, 
  PhoneOff,
  Plus, 
  Hash, 
  Lock, 
  Users, 
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import VideoCallInterface from '@/components/ics/VideoCallInterface';
import { usePresence } from '@/components/ics/usePresence';
import PresenceIndicator from '@/components/ics/PresenceIndicator';
import StatusSelector from '@/components/ics/StatusSelector';
import FileUploader from '@/components/ics/FileUploader';
import FilePreview from '@/components/ics/FilePreview';
import Sidebar from '@/components/ics/Sidebar';
import ConversationsList from '@/components/ics/ConversationsList';
import ChatArea from '@/components/ics/ChatArea';
import UsersList from '@/components/ics/UsersList';
import NotificationsView from '@/components/ics/NotificationsView';
import ArchivedList from '@/components/ics/ArchivedList';
import NotificationPreferences from '@/components/notifications/NotificationPreferences.jsx';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { playNotificationSound, isInDND } from '@/components/notifications/NotificationSounds';
import { extractMentions, createMentionNotifications } from '@/components/notifications/MentionParser';

export default function ICS() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [typingByChannel, setTypingByChannel] = useState({});
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { userPresence, allPresence, getPresence, updatePresence } = usePresence(user);

  // Load notification preferences
  const { data: prefsData } = useQuery({
    queryKey: ['notification-prefs', user?.email],
    queryFn: async () => {
      if (!user) return null;
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
      return allChannels.filter(c => 
        !c.is_archived && 
        (c.type === 'public' || c.members?.includes(user?.email))
      );
    },
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date', 500);
      return users.filter(u => u.email !== user?.email);
    },
    enabled: !!user,
  });

  const { data: archivedChannels = [] } = useQuery({
    queryKey: ['archived-channels'],
    queryFn: async () => {
      const allChannels = await base44.entities.Channel.list();
      return allChannels.filter(c => c.is_archived);
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const allMessages = await base44.entities.Message.list();
      return allMessages
        .filter(m => m.channel_id === selectedChannel.id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!selectedChannel,
    refetchInterval: 3000,
  });

  const { data: activeCall } = useQuery({
    queryKey: ['active-call', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return null;
      const calls = await base44.entities.VideoCall.list();
      return calls.find(c => c.channel_id === selectedChannel.id && c.status === 'active');
    },
    enabled: !!selectedChannel,
    refetchInterval: 5000,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedChannel) return;
    
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
      const mentionedEmails = extractMentions(newMessage.content, channels.flatMap(c => c.members));
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
            } catch (err) {
              console.log('Desktop notifications not supported');
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
    mutationFn: (callId) => base44.entities.VideoCall.update(callId, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-call'] });
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
      const waitingRoom = activeCall?.waiting_room?.filter(u => u.email !== userEmail) || [];
      const participants = [...(activeCall?.participants || []), {
        email: userEmail,
        name: userName,
        joined_at: new Date().toISOString(),
      }];
      return base44.entities.VideoCall.update(callId, {
        waiting_room: waitingRoom,
        participants,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-call'] });
    },
  });

  const handleCreateChannel = () => {
    createChannelMutation.mutate({
      name: newChannelName,
      description: newChannelDesc,
      type: newChannelType,
      created_by: user?.email,
      members: newChannelType === 'private' ? [user?.email] : [],
      last_activity: new Date().toISOString(),
    });
  };

  const handleSendMessage = (messageData) => {
    if (!selectedChannel) return;

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
    startCallMutation.mutate({
      channel_id: selectedChannel.id,
      room_id: roomId,
      started_by: user?.email,
      started_at: new Date().toISOString(),
      participants: [{
        email: user?.email,
        name: user?.full_name,
        joined_at: new Date().toISOString(),
      }],
      waiting_room: [],
      recording_status: 'not_started',
      settings: {
        waiting_room_enabled: false,
        allow_screen_share: true,
        auto_record: false,
      },
    });
  };

  const handleEndCall = () => {
    if (activeCall) {
      updatePresence('online', false);
      endCallMutation.mutate(activeCall.id);
    }
  };

  const handleToggleRecording = () => {
    if (!activeCall) return;
    const newStatus = activeCall.recording_status === 'recording' ? 'paused' : 'recording';
    updateCallMutation.mutate({
      callId: activeCall.id,
      data: {
        recording_status: newStatus,
        recording_started_at: newStatus === 'recording' && !activeCall.recording_started_at 
          ? new Date().toISOString() 
          : activeCall.recording_started_at,
      },
    });
  };

  const handleAdmitUser = (userEmail, userName) => {
    if (!activeCall) return;
    admitFromWaitingRoomMutation.mutate({
      callId: activeCall.id,
      userEmail,
      userName,
    });
  };

  const handleToggleWaitingRoom = () => {
    if (!activeCall) return;
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

  const handleTyping = (isTyping) => {
    if (!selectedChannel || !user) return;
    
    setTypingByChannel(prev => {
      const channelTyping = prev[selectedChannel.id] || [];
      if (isTyping) {
        if (!channelTyping.includes(user.full_name)) {
          return {
            ...prev,
            [selectedChannel.id]: [...channelTyping, user.full_name],
          };
        }
      } else {
        return {
          ...prev,
          [selectedChannel.id]: channelTyping.filter(name => name !== user.full_name),
        };
      }
      return prev;
    });
  };

  return (
    <div className={`h-screen flex ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        darkMode={darkMode}
        onThemeToggle={() => setDarkMode(!darkMode)}
        onSettingsClick={() => setShowSettings(true)}
        user={user}
        unreadCount={channels.filter(c => messages.filter(m => m.channel_id === c.id && m.created_date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length > 0).length}
        notificationButton={
          <div className="flex flex-col gap-2 w-full">
            <NotificationCenter user={user} />
            <NotificationPreferences 
              user={user} 
              onPreferencesUpdate={handlePreferencesUpdate}
            />
          </div>
        }
      />

      {activeView === 'chat' ? (
        <>
          <ConversationsList
            channels={channels}
            selectedChannelId={selectedChannel?.id}
            onSelectChannel={setSelectedChannel}
            onNewChat={() => setShowNewChannel(true)}
            darkMode={darkMode}
            allPresence={allPresence}
            typingByChannel={typingByChannel}
          />

          <ChatArea
            channel={selectedChannel}
            user={user}
            messages={messages}
            darkMode={darkMode}
            onSendMessage={handleSendMessage}
            onStartCall={handleStartCall}
            onShowProfile={() => setShowProfile(true)}
            typingUsers={selectedChannel ? typingByChannel[selectedChannel.id] || [] : []}
            onTyping={handleTyping}
          />
        </>
      ) : activeView === 'contacts' ? (
        <UsersList
          users={allUsers}
          allPresence={allPresence}
          darkMode={darkMode}
          onSelectUser={(selectedUser, action) => {
            if (action === 'message') {
              // Create or find direct message channel
              const dmChannel = channels.find(c => 
                c.type === 'dm' && 
                c.members?.includes(selectedUser.email) &&
                c.members?.includes(user?.email)
              );
              
              if (dmChannel) {
                setSelectedChannel(dmChannel);
              } else {
                // Create new DM channel
                createChannelMutation.mutate({
                  name: selectedUser.full_name,
                  type: 'dm',
                  created_by: user?.email,
                  members: [user?.email, selectedUser.email],
                  last_activity: new Date().toISOString(),
                });
              }
              setActiveView('chat');
            } else if (action === 'call') {
              // Start a call with the user
              handleStartCall();
            }
          }}
          currentUser={user}
        />
      ) : activeView === 'notifications' ? (
        <NotificationsView user={user} darkMode={darkMode} />
      ) : activeView === 'archived' ? (
        <ArchivedList 
          channels={archivedChannels} 
          darkMode={darkMode}
          onSelectChannel={(channel) => {
            setSelectedChannel(channel);
            setActiveView('chat');
          }}
        />
      ) : null}
        </div>
        );
}