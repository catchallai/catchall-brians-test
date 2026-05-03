import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  User,
  Bell,
  Palette,
  Globe,
  Database,
  Save,
  Loader2,
  Zap,
  ToggleRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import AutoSyncSettings from '@/components/settings/AutoSyncSettings';
import DepartmentPermissionsManager from '@/components/settings/DepartmentPermissionsManager';
import UserManagement from '@/components/settings/UserManagement';
import DataManagement from '@/components/settings/DataManagement';
import AIToggleSettings from '@/components/settings/AIToggleSettings';


const SETTINGS_SECTIONS = [
  {
    group: 'Account',
    tabs: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    group: 'Appearance & Behavior',
    tabs: [
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'preferences', label: 'Preferences', icon: Zap },
    ],
  },
  {
    group: 'Administration',
    tabs: [
      { id: 'team', label: 'Team & Permissions', icon: Lock },
      { id: 'data', label: 'Data Management', icon: Database },
      { id: 'autosync', label: 'Auto-Sync', icon: RefreshCw },
      { id: 'ai', label: 'AI Settings', icon: Zap },
    ],
  },
];

const SETTINGS_TABS = SETTINGS_SECTIONS.flatMap(s => s.tabs.map(t => t.id));
const getValidSettingsTab = (tab) => (SETTINGS_TABS.includes(tab) ? tab : 'profile');

const buildProfileUpdatePayload = (profile) => ({
  timezone: profile.timezone,
  language: profile.language,
  job_title: profile.job_title,
  company: profile.company,
  phone: profile.phone,
  bio: profile.bio,
});

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(getValidSettingsTab(searchParams.get('tab')));
  const queryClient = useQueryClient();
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
    job_title: '',
    company: '',
    phone: '',
    bio: '',
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

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        timezone: user.timezone || 'America/New_York',
        language: user.language || 'en',
        job_title: user.job_title || '',
        company: user.company || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
      if (user.notification_settings) {
        setNotifications(user.notification_settings);
      }
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [user]);

  useEffect(() => {
    setActiveTab(getValidSettingsTab(searchParams.get('tab')));
  }, [searchParams]);

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
    try {
      await saveMutation.mutateAsync({
        ...buildProfileUpdatePayload(profile),
        notification_settings: notifications,
        preferences,
      });
    } finally {
      setSaving(false);
    }
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
    <div className="p-6 lg:p-8 space-y-6 min-h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your account and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Navigation */}
        <div className="glass-card rounded-xl p-0 overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
            {SETTINGS_SECTIONS.flatMap(section => section.tabs).map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/10'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500">Contact admin to change</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-gray-50 dark:bg-gray-800" />
                  <p className="text-xs text-gray-500">Contact admin to change</p>
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={profile.job_title}
                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Bio</Label>
                  <Input
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(v) => setProfile({ ...profile, timezone: v })}
                  >
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
                  <Select
                    value={profile.language}
                    onValueChange={(v) => setProfile({ ...profile, language: v })}
                  >
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
                  {
                    key: 'email_deals',
                    label: 'Deal Updates',
                    desc: 'Get notified when deals change stage',
                  },
                  {
                    key: 'email_keywords',
                    label: 'Keyword Alerts',
                    desc: 'Ranking changes for tracked keywords',
                  },
                  {
                    key: 'email_mentions',
                    label: 'Social Mentions',
                    desc: 'New mentions of your brand',
                  },
                  {
                    key: 'email_reports',
                    label: 'Scheduled Reports',
                    desc: 'Receive automated SEO reports',
                  },
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
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email Digest Frequency
                    </p>
                    <p className="text-sm text-gray-500">How often to receive summary emails</p>
                  </div>
                  <Select
                    value={notifications.digest_frequency}
                    onValueChange={(v) =>
                      setNotifications({ ...notifications, digest_frequency: v })
                    }
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
                      <div
                        className={`w-8 h-8 rounded-lg mx-auto mb-2 ${
                          t === 'light'
                            ? 'bg-white border'
                            : t === 'dark'
                              ? 'bg-gray-800'
                              : 'bg-gradient-to-r from-white to-gray-800'
                        }`}
                      />
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
                  onValueChange={(v) =>
                    setPreferences({ ...preferences, items_per_page: Number(v) })
                  }
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

        {/* Auto-Sync Tab */}
        <TabsContent value="autosync">
          <AutoSyncSettings />
        </TabsContent>

        {/* Team & Permissions Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="space-y-6">
            {/* Team Users Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Users</h2>
              <UserManagement />
            </div>

            {/* Department Permissions Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Permissions</h2>
              <DepartmentPermissionsManager />
            </div>
          </div>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          {user?.role === 'admin' ? (
            <DataManagement />
          ) : (
            <Card className="glass-card rounded-2xl">
              <CardContent className="pt-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Admin access required for data management.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Settings Tab */}
        <TabsContent value="ai" className="space-y-6">
          {user?.role === 'admin' ? (
            <AIToggleSettings />
          ) : (
            <Card className="glass-card rounded-2xl">
              <CardContent className="pt-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Admin access required to manage AI settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}