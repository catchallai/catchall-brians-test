import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Radio, AlertTriangle, Search, RefreshCw, Clock } from 'lucide-react';

export default function ICSAdminPortal({ darkMode }) {
  const [searchUser, setSearchUser] = useState('');
  const queryClient = useQueryClient();

  // Fetch data
  const { data: presences = [] } = useQuery({
    queryKey: ['ics-presences'],
    queryFn: () => base44.entities.Presence.list('-updated_at', 1000),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['ics-messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['ics-channels'],
    queryFn: () => base44.entities.Channel.list('-created_date', 200),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['ics-notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 100),
  });

  // Calculate stats
  const onlineUsers = presences.filter((p) => p.status === 'online').length;
  const awayUsers = presences.filter((p) => p.status === 'away').length;
  const inCallUsers = presences.filter((p) => p.in_call).length;
  const totalMessages = messages.length;
  const todayMessages = messages.filter((m) => {
    const date = new Date(m.created_date);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;
  const activeChannels = channels.length;
  const unreadNotifications = notifications.filter((n) => !n.is_read).length;

  // Filter users
  const filteredUsers = presences.filter(
    (p) =>
      !searchUser ||
      p.user_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      p.user_email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Get channel stats
  const getChannelStats = (channelId) => {
    return messages.filter((m) => m.channel_id === channelId).length;
  };

  // Get user stats
  const getUserStats = (userEmail) => {
    return {
      messages: messages.filter((m) => m.sender_email === userEmail).length,
      notifications: notifications.filter((n) => n.user_email === userEmail).length,
    };
  };

  const bgClass = darkMode ? 'bg-slate-950' : 'bg-slate-50';
  const cardBgClass = darkMode ? 'bg-slate-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const secondaryTextClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`flex-1 overflow-auto ${bgClass} p-6 space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${textClass}`}>ICS Admin Dashboard</h2>
          <p className={`text-sm ${secondaryTextClass} mt-1`}>
            Monitor system health and user activity
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ics'] })}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 lg:grid-cols-5 gap-3`}>
        <Card className={`${cardBgClass} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs uppercase font-semibold ${secondaryTextClass}`}>Online</p>
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${textClass}`}>{onlineUsers}</p>
          </CardContent>
        </Card>

        <Card className={`${cardBgClass} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs uppercase font-semibold ${secondaryTextClass}`}>Away</p>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className={`text-2xl font-bold ${textClass}`}>{awayUsers}</p>
          </CardContent>
        </Card>

        <Card className={`${cardBgClass} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs uppercase font-semibold ${secondaryTextClass}`}>In Calls</p>
              <Radio className="w-4 h-4 text-blue-600" />
            </div>
            <p className={`text-2xl font-bold ${textClass}`}>{inCallUsers}</p>
          </CardContent>
        </Card>

        <Card className={`${cardBgClass} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs uppercase font-semibold ${secondaryTextClass}`}>Today</p>
              <MessageSquare className="w-4 h-4 text-violet-600" />
            </div>
            <p className={`text-2xl font-bold ${textClass}`}>{todayMessages}</p>
          </CardContent>
        </Card>

        <Card className={`${cardBgClass} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs uppercase font-semibold ${secondaryTextClass}`}>Alerts</p>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className={`text-2xl font-bold ${textClass}`}>{unreadNotifications}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList
          className={`grid w-full grid-cols-3 ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}
        >
          <TabsTrigger value="users">Users ({presences.length})</TabsTrigger>
          <TabsTrigger value="channels">Channels ({activeChannels})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({totalMessages})</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className={secondaryTextClass}>No users found</p>
            ) : (
              filteredUsers.map((presence) => {
                const stats = getUserStats(presence.user_email);
                const statusColor = {
                  online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                  away: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                  offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
                };

                return (
                  <Card key={presence.id} className={`${cardBgClass} border-0`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${textClass} truncate`}>
                              {presence.user_name}
                            </p>
                            <Badge className={`${statusColor[presence.status]} text-xs`}>
                              {presence.status}
                            </Badge>
                            {presence.in_call && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                Call
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs ${secondaryTextClass} truncate`}>
                            {presence.user_email}
                          </p>
                          <div className={`flex gap-4 text-xs ${secondaryTextClass} mt-1`}>
                            <span>{stats.messages} msgs</span>
                            <span>{stats.notifications} notes</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-3 mt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {channels.length === 0 ? (
              <p className={secondaryTextClass}>No channels</p>
            ) : (
              channels.map((channel) => {
                const messageCount = getChannelStats(channel.id);
                return (
                  <Card key={channel.id} className={`${cardBgClass} border-0`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${textClass}`}>#{channel.name}</p>
                            {channel.is_private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs ${secondaryTextClass}`}>{messageCount} messages</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-3 mt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className={secondaryTextClass}>No messages</p>
            ) : (
              messages.slice(0, 20).map((msg) => (
                <Card key={msg.id} className={`${cardBgClass} border-0`}>
                  <CardContent className="p-3">
                    <p className={`text-sm font-medium ${textClass}`}>{msg.sender_name}</p>
                    <p className={`text-xs ${secondaryTextClass} line-clamp-2 mt-1`}>
                      {msg.content}
                    </p>
                    <p className={`text-xs ${secondaryTextClass} mt-1`}>
                      {new Date(msg.created_date).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
