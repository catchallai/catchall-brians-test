import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/components/ui/toast-provider';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  User, Bell, Shield, Palette, Globe, Database, 
  Save, Loader2, Check, Mail, Clock, Zap, ToggleRight, RefreshCw, Users
} from "lucide-react";
import FeatureManager from '@/components/settings/FeatureManager';
import AutoSyncSettings from '@/components/settings/AutoSyncSettings';
import TeamManagement from '@/components/settings/TeamManagement';
import RoleManagement from '@/components/settings/RoleManagement';

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { theme, setTheme } = useTheme();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    timezone: 'America/New_York',
    language: 'en',
  });

  const [notifications, setNotifications] = useState({
    email_deals: true,
    email_keywords: true,
    email_mentions: true,
    email_reports: true,
    push_enabled: false,
    digest_frequency: 'daily',
  });

  const [preferences, setPreferences] = useState({
    default_dashboard: 'main',
    items_per_page: 25,
    compact_mode: false,
    show_tooltips: true,
  });

  React.useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        timezone: user.timezone || 'America/New_York',
        language: user.language || 'en',
      });
      if (user.notification_settings) {
        setNotifications(user.notification_settings);
      }
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleSave = async () => {
    setSaving(true);
    await saveMutation.mutateAsync({
      full_name: profile.full_name,
      timezone: profile.timezone,
      language: profile.language,
      notification_settings: notifications,
      preferences: preferences,
    });
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Zap className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ToggleRight className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="autosync" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Auto-Sync
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-gray-50 dark:bg-gray-800" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={profile.language} onValueChange={(v) => setProfile({ ...profile, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Badge className="bg-violet-100 text-violet-700">
                  Role: {user?.role || 'user'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'email_deals', label: 'Deal Updates', desc: 'Get notified when deals change stage' },
                  { key: 'email_keywords', label: 'Keyword Alerts', desc: 'Ranking changes for tracked keywords' },
                  { key: 'email_mentions', label: 'Social Mentions', desc: 'New mentions of your brand' },
                  { key: 'email_reports', label: 'Scheduled Reports', desc: 'Receive automated SEO reports' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Digest Frequency</p>
                    <p className="text-sm text-gray-500">How often to receive summary emails</p>
                  </div>
                  <Select 
                    value={notifications.digest_frequency} 
                    onValueChange={(v) => setNotifications({ ...notifications, digest_frequency: v })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === t 
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 ${
                        t === 'light' ? 'bg-white border' : 
                        t === 'dark' ? 'bg-gray-800' : 
                        'bg-gradient-to-r from-white to-gray-800'
                      }`} />
                      <p className="text-sm font-medium capitalize">{t}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Compact Mode</p>
                  <p className="text-sm text-gray-500">Reduce spacing for denser layouts</p>
                </div>
                <Switch
                  checked={preferences.compact_mode}
                  onCheckedChange={(v) => setPreferences({ ...preferences, compact_mode: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Items Per Page</p>
                  <p className="text-sm text-gray-500">Number of items to show in lists</p>
                </div>
                <Select 
                  value={String(preferences.items_per_page)} 
                  onValueChange={(v) => setPreferences({ ...preferences, items_per_page: Number(v) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Show Tooltips</p>
                  <p className="text-sm text-gray-500">Display helpful hints throughout the app</p>
                </div>
                <Switch
                  checked={preferences.show_tooltips}
                  onCheckedChange={(v) => setPreferences({ ...preferences, show_tooltips: v })}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Default Dashboard</p>
                  <p className="text-sm text-gray-500">Which dashboard to show on login</p>
                </div>
                <Select 
                  value={preferences.default_dashboard} 
                  onValueChange={(v) => setPreferences({ ...preferences, default_dashboard: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <FeatureManager />
        </TabsContent>

        {/* Auto-Sync Tab */}
        <TabsContent value="autosync">
          <AutoSyncSettings />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card className="glass-card rounded-2xl p-6">
            <TeamManagement />
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card className="glass-card rounded-2xl p-6">
            <RoleManagement />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}