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

export default function ICS() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('public');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { userPresence, allPresence, getPresence, updatePresence } = usePresence(user);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageInput('');
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannel) return;

    sendMessageMutation.mutate({
      channel_id: selectedChannel.id,
      content: messageInput,
      sender_email: user?.email,
      sender_name: user?.full_name,
    });
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

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-violet-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ICS</h1>
          <span className="text-sm text-gray-500">Internal Communication System</span>
        </div>
        <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Channel Name</Label>
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="general, announcements, random..."
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  rows={3}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newChannelType} onValueChange={setNewChannelType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can join</SelectItem>
                    <SelectItem value="private">Private - Invite only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateChannel}
                disabled={!newChannelName || createChannelMutation.isPending}
                className="w-full"
              >
                Create Channel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Channels */}
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search channels..."
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-2">
           <div className="space-y-1">
             {filteredChannels.map((channel) => {
               const channelPresence = channel.members?.map(email => getPresence(email)).filter(Boolean) || [];
               const onlineCount = channelPresence.filter(p => p.status === 'online').length;

               return (
                 <button
                   key={channel.id}
                   onClick={() => setSelectedChannel(channel)}
                   className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                     selectedChannel?.id === channel.id
                       ? 'bg-violet-600 text-white'
                       : 'text-gray-300 hover:bg-gray-800'
                   }`}
                 >
                   {channel.type === 'public' ? (
                     <Hash className="w-4 h-4 flex-shrink-0" />
                   ) : (
                     <Lock className="w-4 h-4 flex-shrink-0" />
                   )}
                   <span className="truncate font-medium">{channel.name}</span>
                   {onlineCount > 0 && (
                     <span className="ml-auto text-xs bg-green-600 px-2 py-0.5 rounded-full">
                       {onlineCount}
                     </span>
                   )}
                 </button>
               );
             })}
           </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        {selectedChannel ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            {/* Channel Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{selectedChannel.name}</h2>
                  {selectedChannel.description && (
                    <p className="text-sm text-gray-500">{selectedChannel.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeCall ? (
                  <Button
                    variant={isInCall ? "destructive" : "default"}
                    onClick={isInCall ? handleEndCall : () => setIsInCall(true)}
                    className="gap-2"
                  >
                    {isInCall ? (
                      <>
                        <PhoneOff className="w-4 h-4" />
                        Leave Call
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        Join Call ({activeCall.participants?.length || 0})
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleStartCall} variant="outline" className="gap-2">
                    <Video className="w-4 h-4" />
                    Start Call
                  </Button>
                )}
              </div>
            </div>

            {/* Video Call Interface */}
            {isInCall && (
              <VideoCallInterface
                activeCall={activeCall}
                user={user}
                onEndCall={handleEndCall}
                onToggleRecording={handleToggleRecording}
                onToggleWaitingRoom={handleToggleWaitingRoom}
                onAdmitUser={handleAdmitUser}
                updateCallMutation={updateCallMutation}
              />
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => {
                  const senderPresence = getPresence(message.sender_email);
                  return (
                    <div key={message.id} className="flex gap-3 group">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                            {message.sender_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {senderPresence && (
                          <div className="absolute -bottom-1 -right-1 bg-gray-900 dark:bg-gray-800 rounded-full p-1">
                            <PresenceIndicator presence={senderPresence} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {message.sender_name}
                          </span>
                          {senderPresence && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <PresenceIndicator presence={senderPresence} size="sm" />
                              {senderPresence.in_call ? 'In Call' : senderPresence.status}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.created_date), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message #${selectedChannel.name}`}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a channel to start
              </h3>
              <p className="text-gray-500">
                Choose a channel from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}