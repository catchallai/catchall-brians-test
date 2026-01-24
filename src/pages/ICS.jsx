import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MoreVertical,
  Archive,
  Bell,
  Mail,
  Clock
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
import NotificationPreferences from '@/components/notifications/NotificationPreferences.jsx';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { playNotificationSound, isInDND } from '@/components/notifications/NotificationSounds';
import { extractMentions, createMentionNotifications } from '@/components/notifications/MentionParser';

export default function ICS() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [chatTab, setChatTab] = useState('messages'); // 'messages', 'contacts', 'notifications', 'archive'
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [typingByChannel, setTypingByChannel] = useState({});
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [searchContacts, setSearchContacts] = useState('');
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

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const allContacts = await base44.entities.Contact.list();
      return allContacts;
    },
  });

  const { data: archivedChannels = [] } = useQuery({
    queryKey: ['archived-channels'],
    queryFn: async () => {
      const allChannels = await base44.entities.Channel.list();
      return allChannels.filter(c => c.is_archived);
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allNotifications = await base44.entities.Notification.filter({
        user_email: user.email,
      }, '-created_date', 50);
      return allNotifications;
    },
    enabled: !!user?.email,
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

  const markNotificationAsRead = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, {
      is_read: true,
      read_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unarchiveChannelMutation = useMutation({
    mutationFn: (channelId) => base44.entities.Channel.update(channelId, {
      is_archived: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-channels'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchContacts.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchContacts.toLowerCase())
  );

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
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={chatTab} onValueChange={setChatTab} className="w-full h-full flex flex-col">
            <TabsList className="px-4 py-3 border-b border-slate-800">
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <Users className="w-4 h-4" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="archive" className="gap-2">
                <Archive className="w-4 h-4" />
                Archive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="flex-1 overflow-hidden flex">
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
            </TabsContent>

            <TabsContent value="contacts" className="flex-1 overflow-hidden flex flex-col">
              <div className={`flex-1 flex flex-col ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className="p-4 border-b border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchContacts}
                      onChange={(e) => setSearchContacts(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 p-4">
                    {filteredContacts.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No contacts found</p>
                      </div>
                    ) : (
                      filteredContacts.map(contact => (
                        <div key={contact.id} className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-violet-600 text-white text-xs">
                                {contact.first_name[0]}{contact.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="flex-1 overflow-hidden flex flex-col">
              <div className={`flex-1 flex flex-col ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 p-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg cursor-pointer transition ${
                            notif.is_read 
                              ? 'bg-slate-800 hover:bg-slate-700' 
                              : 'bg-violet-900/30 hover:bg-violet-900/50 border border-violet-500/30'
                          }`}
                          onClick={() => !notif.is_read && markNotificationAsRead.mutate(notif.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{notif.title}</p>
                              <p className="text-xs text-slate-300 mt-1">{notif.body}</p>
                              <p className="text-xs text-slate-500 mt-2">
                                {format(new Date(notif.created_date), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 rounded-full bg-violet-500 mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="archive" className="flex-1 overflow-hidden flex flex-col">
              <div className={`flex-1 flex flex-col ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 p-4">
                    {archivedChannels.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No archived channels</p>
                      </div>
                    ) : (
                      archivedChannels.map(channel => (
                        <div key={channel.id} className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {channel.type === 'private' && <Lock className="w-3 h-3 inline mr-1" />}
                                  {channel.type === 'public' && <Hash className="w-3 h-3 inline mr-1" />}
                                  {channel.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{channel.description || 'No description'}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unarchiveChannelMutation.mutate(channel.id)}
                              disabled={unarchiveChannelMutation.isPending}
                              className="flex-shrink-0"
                            >
                              Restore
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        ) : null}
        </div>
        );
}