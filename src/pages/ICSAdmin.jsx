import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  MessageSquare,
  Radio,
  Activity,
  Settings,
  Trash2,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

export default function ICSAdmin() {
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  // Verify admin access
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch data
  const { data: presences = [], isLoading: loadingPresences } = useQuery({
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

  const { data: communications = [] } = useQuery({
    queryKey: ['ics-communications'],
    queryFn: () => base44.entities.Communication.list('-created_date', 200),
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

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Only administrators can access this portal.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ICS Admin Portal</h1>
          <p className="text-gray-500 mt-1">Monitor and manage the internal communication system</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ics'] })}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      {loadingPresences ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">Online Users</p>
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{onlineUsers}</p>
              <p className="text-xs text-gray-500 mt-1">of {presences.length} total</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">Away Users</p>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{awayUsers}</p>
              <p className="text-xs text-gray-500 mt-1">idle or inactive</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">In Calls</p>
                <Radio className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inCallUsers}</p>
              <p className="text-xs text-gray-500 mt-1">active video calls</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">Messages Today</p>
                <MessageSquare className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayMessages}</p>
              <p className="text-xs text-gray-500 mt-1">{totalMessages} total</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Unread Notifications
                </p>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadNotifications}
              </p>
              <p className="text-xs text-gray-500 mt-1">pending review</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users ({presences.length})</TabsTrigger>
          <TabsTrigger value="channels">Channels ({activeChannels})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No users found</p>
              </Card>
            ) : (
              filteredUsers.map((presence) => {
                const stats = getUserStats(presence.user_email);
                const statusColor = {
                  online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                  away: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                  offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
                };

                return (
                  <Card
                    key={presence.id}
                    className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {presence.user_name}
                            </h3>
                            <Badge className={statusColor[presence.status] || statusColor.offline}>
                              {presence.status}
                            </Badge>
                            {presence.in_call && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                In Call
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{presence.user_email}</p>
                          {presence.custom_status && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              {presence.status_emoji} {presence.custom_status}
                            </p>
                          )}
                          <div className="flex gap-6 text-xs text-gray-500 mt-2">
                            <span>{stats.messages} messages</span>
                            <span>{stats.notifications} notifications</span>
                            <span>
                              Last active: {new Date(presence.last_activity).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Shield className="w-4 h-4 mr-1" />
                            View
                          </Button>
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
        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4">
            {channels.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No channels yet</p>
              </Card>
            ) : (
              channels.map((channel) => {
                const messageCount = getChannelStats(channel.id);
                return (
                  <Card key={channel.id} className="bg-white dark:bg-gray-800 border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              #{channel.name}
                            </h3>
                            {channel.is_private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                          {channel.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {channel.description}
                            </p>
                          )}
                          <div className="flex gap-6 text-xs text-gray-500">
                            <span>{messageCount} messages</span>
                            <span>
                              Created {new Date(channel.created_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Messages */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {messages.slice(0, 10).map((msg) => (
                  <div
                    key={msg.id}
                    className="pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {msg.sender_email}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {msg.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_date).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {presences.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Channels</span>
                  <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                    {activeChannels}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Messages</span>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {totalMessages}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">System Health</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Healthy
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                ICS Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Message Retention:</strong> All messages are retained. Archive policy can
                  be configured per channel.
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>User Invitations:</strong> Admins can invite users. Pending invitations: 0
                </p>
              </div>

              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                <p className="text-sm text-violet-800 dark:text-violet-300">
                  <strong>Notification Settings:</strong> Customize notification preferences for all
                  users or per-channel.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  Configure Advanced Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
