import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast-provider';
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Activity,
  Camera,
  Save,
  Key,
  Crown,
  Calendar,
  TrendingUp,
  Smile,
  Clock,
  Volume2,
  Moon,
  Sun,
} from 'lucide-react';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    website: user?.website || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });

  const [preferences, setPreferences] = useState({
    email_notifications: user?.email_notifications ?? true,
    marketing_emails: user?.marketing_emails ?? false,
    weekly_digest: user?.weekly_digest ?? true,
    theme: user?.theme || localStorage.getItem('theme') || 'light',
    status: user?.status || 'online',
    status_emoji: user?.status_emoji || '✨',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    messages_enabled: user?.messages_enabled ?? true,
    mentions_enabled: user?.mentions_enabled ?? true,
    updates_enabled: user?.updates_enabled ?? true,
    sound_enabled: user?.sound_enabled ?? true,
    desktop_notifications_enabled: user?.desktop_notifications_enabled ?? true,
    do_not_disturb_enabled: user?.do_not_disturb_enabled ?? false,
    dnd_start_time: user?.dnd_start_time || '22:00',
    dnd_end_time: user?.dnd_end_time || '08:00',
    muted_channels: user?.muted_channels || [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });

  const handleSaveProfile = () => {
    const { email, ...updateData } = profileData;
    updateProfileMutation.mutate(updateData);
  };

  const handleSavePreferences = () => {
    // Persist theme to localStorage
    localStorage.setItem('theme', preferences.theme);
    updateProfileMutation.mutate(preferences);
  };

  const handleSaveNotificationPrefs = () => {
    updateProfileMutation.mutate(notificationPrefs);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateProfileMutation.mutate({ avatar_url: file_url });
        toast.success('Avatar updated successfully');
      } catch (error) {
        toast.error('Failed to upload avatar');
      }
    }
  };

  React.useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        website: user.website || '',
        bio: user.bio || '',
        location: user.location || '',
      });
      setPreferences({
        email_notifications: user.email_notifications ?? true,
        marketing_emails: user.marketing_emails ?? false,
        weekly_digest: user.weekly_digest ?? true,
        theme: user.theme || localStorage.getItem('theme') || 'light',
        status: user.status || 'online',
        status_emoji: user.status_emoji || '✨',
      });
      setNotificationPrefs({
        messages_enabled: user.messages_enabled ?? true,
        mentions_enabled: user.mentions_enabled ?? true,
        updates_enabled: user.updates_enabled ?? true,
        sound_enabled: user.sound_enabled ?? true,
        desktop_notifications_enabled: user.desktop_notifications_enabled ?? true,
        do_not_disturb_enabled: user.do_not_disturb_enabled ?? false,
        dnd_start_time: user.dnd_start_time || '22:00',
        dnd_end_time: user.dnd_end_time || '08:00',
        muted_channels: user.muted_channels || [],
      });
    }
  }, [user]);

  const stats = [
    {
      label: 'Member Since',
      value: user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A',
      icon: Calendar,
    },
    { label: 'Role', value: user?.role || 'User', icon: Crown },
    { label: 'Login Count', value: '247', icon: Activity },
    { label: 'Activity Score', value: '89%', icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-lg">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl font-bold">
                {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors shadow-lg cursor-pointer">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.full_name || 'User'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-violet-100 text-violet-700 border-violet-300">
              <Crown className="w-3 h-3 mr-1" />
              {user?.role || 'User'}
            </Badge>
            <Badge variant="outline">Active</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <Icon className="w-5 h-5 text-violet-600 mb-2" />
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-violet-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={profileData.email}
                  type="email"
                  disabled
                  placeholder="Contact admin to change email"
                />
                <p className="text-xs text-gray-500">Contact administrator to change your email</p>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-violet-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    placeholder="Your company name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                Password & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Key className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enable 2FA</p>
                  <p className="text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch checked={user?.two_factor_enabled || false} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  device: 'Chrome on Windows',
                  location: 'New York, US',
                  active: true,
                  lastActive: 'Now',
                },
                {
                  device: 'Safari on iPhone',
                  location: 'New York, US',
                  active: false,
                  lastActive: '2 hours ago',
                },
              ].map((session, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{session.device}</p>
                    <p className="text-sm text-gray-500">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                  {session.active ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                      Active
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-violet-600" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Messages</p>
                  <p className="text-sm text-gray-500">Notify me of new messages</p>
                </div>
                <Switch
                  checked={notificationPrefs.messages_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, messages_enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Mentions</p>
                  <p className="text-sm text-gray-500">Alert me when someone mentions me</p>
                </div>
                <Switch
                  checked={notificationPrefs.mentions_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, mentions_enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Updates</p>
                  <p className="text-sm text-gray-500">Important system and security updates</p>
                </div>
                <Switch
                  checked={notificationPrefs.updates_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, updates_enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sound & Desktop Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-violet-600" />
                    Sound Notifications
                  </p>
                  <p className="text-sm text-gray-500">Play sound for new notifications</p>
                </div>
                <Switch
                  checked={notificationPrefs.sound_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, sound_enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Desktop Notifications</p>
                  <p className="text-sm text-gray-500">
                    Show browser notifications even when app is closed
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.desktop_notifications_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      desktop_notifications_enabled: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-600" />
                Do Not Disturb (DND)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enable DND Schedule</p>
                  <p className="text-sm text-gray-500">Mute notifications during specific hours</p>
                </div>
                <Switch
                  checked={notificationPrefs.do_not_disturb_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, do_not_disturb_enabled: checked })
                  }
                />
              </div>
              {notificationPrefs.do_not_disturb_enabled && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={notificationPrefs.dnd_start_time}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          dnd_start_time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={notificationPrefs.dnd_end_time}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, dnd_end_time: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveNotificationPrefs}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-violet-600" />
                Status & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={preferences.status}
                  onChange={(e) => setPreferences({ ...preferences, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="online">🟢 Online</option>
                  <option value="away">🟡 Away</option>
                  <option value="offline">⚫ Offline</option>
                  <option value="busy">🔴 Busy</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status Emoji</Label>
                <div className="flex gap-2">
                  <Input
                    value={preferences.status_emoji}
                    onChange={(e) =>
                      setPreferences({ ...preferences, status_emoji: e.target.value })
                    }
                    maxLength={2}
                    placeholder="✨"
                    className="w-20"
                  />
                  <p className="text-sm text-gray-500 flex items-center">
                    Current: {preferences.status_emoji}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSavePreferences}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Status
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-600" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme (Persists across sessions)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setPreferences({ ...preferences, theme: 'light' });
                      localStorage.setItem('theme', 'light');
                    }}
                    className={`p-4 border-2 rounded-lg bg-white dark:bg-gray-800 transition-colors ${preferences.theme === 'light' ? 'border-violet-500' : 'border-gray-300 dark:border-gray-600'} hover:border-violet-600`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button
                    onClick={() => {
                      setPreferences({ ...preferences, theme: 'dark' });
                      localStorage.setItem('theme', 'dark');
                    }}
                    className={`p-4 border-2 rounded-lg bg-white dark:bg-gray-800 transition-colors ${preferences.theme === 'dark' ? 'border-violet-500' : 'border-gray-300 dark:border-gray-600'} hover:border-violet-600`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  <button
                    onClick={() => {
                      setPreferences({ ...preferences, theme: 'auto' });
                      localStorage.setItem('theme', 'auto');
                    }}
                    className={`p-4 border-2 rounded-lg bg-white dark:bg-gray-800 transition-colors ${preferences.theme === 'auto' ? 'border-violet-500' : 'border-gray-300 dark:border-gray-600'} hover:border-violet-600`}
                  >
                    <div className="w-6 h-6 mx-auto mb-2 bg-gradient-to-r from-yellow-500 to-blue-400 rounded"></div>
                    <p className="text-sm font-medium">Auto</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input value="English (US)" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value="(GMT-5:00) Eastern Time" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Input value="MM/DD/YYYY" readOnly />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Compact Mode</p>
                  <p className="text-sm text-gray-500">Show more content in less space</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Show Tips</p>
                  <p className="text-sm text-gray-500">Display helpful tips throughout the app</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-gray-500">Download all your account data</p>
                </div>
                <Button variant="outline">Export</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border-red-300"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
