import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';
import {
  User,
  Bell,
  Link2,
  Key,
  Save,
  Loader2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Trash2,
  Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 50),
  });

  if (loadingUser) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1 mb-6">
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 text-xs sm:text-sm">
            <Link2 className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2 text-xs sm:text-sm">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings user={user} queryClient={queryClient} toast={toast} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings user={user} queryClient={queryClient} toast={toast} />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettings
            user={user}
            socialAccounts={socialAccounts}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="api">
          <APIKeySettings user={user} queryClient={queryClient} toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSettings({ user, queryClient, toast }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    job_title: user?.job_title || '',
    company: user?.company || '',
    phone: user?.phone || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    bio: user?.bio || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-violet-100 text-violet-600 text-2xl">
              {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-sm text-gray-500">
              Member since {new Date(user?.created_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="e.g., Marketing Manager"
            />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Bio</Label>
            <Input
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="A short bio about yourself"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings({ user, queryClient, toast }) {
  const [preferences, setPreferences] = useState({
    email_alerts: user?.notification_preferences?.email_alerts ?? true,
    email_content_ideas: user?.notification_preferences?.email_content_ideas ?? true,
    email_competitor_updates: user?.notification_preferences?.email_competitor_updates ?? true,
    email_weekly_digest: user?.notification_preferences?.email_weekly_digest ?? true,
    email_seo_alerts: user?.notification_preferences?.email_seo_alerts ?? true,
    push_mentions: user?.notification_preferences?.push_mentions ?? true,
    push_engagement_spikes: user?.notification_preferences?.push_engagement_spikes ?? true,
    push_campaign_updates: user?.notification_preferences?.push_campaign_updates ?? false,
    push_deal_updates: user?.notification_preferences?.push_deal_updates ?? true,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ notification_preferences: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Notification preferences saved');
    },
    onError: () => toast.error('Failed to save preferences'),
  });

  const notificationGroups = [
    {
      title: 'Email Notifications',
      icon: Mail,
      items: [
        {
          key: 'email_alerts',
          label: 'Critical Alerts',
          description: 'Important system and security alerts',
          icon: AlertTriangle,
        },
        {
          key: 'email_content_ideas',
          label: 'Content Ideas',
          description: 'New AI-generated content suggestions',
          icon: Lightbulb,
        },
        {
          key: 'email_competitor_updates',
          label: 'Competitor Updates',
          description: 'Changes in competitor activity',
          icon: Target,
        },
        {
          key: 'email_weekly_digest',
          label: 'Weekly Digest',
          description: 'Summary of your weekly performance',
          icon: TrendingUp,
        },
        {
          key: 'email_seo_alerts',
          label: 'SEO Alerts',
          description: 'Ranking changes and technical issues',
          icon: TrendingUp,
        },
      ],
    },
    {
      title: 'Push Notifications',
      icon: Bell,
      items: [
        {
          key: 'push_mentions',
          label: 'Social Mentions',
          description: 'When your brand is mentioned',
          icon: MessageSquare,
        },
        {
          key: 'push_engagement_spikes',
          label: 'Engagement Spikes',
          description: 'Unusual engagement activity',
          icon: TrendingUp,
        },
        {
          key: 'push_campaign_updates',
          label: 'Campaign Updates',
          description: 'Campaign performance milestones',
          icon: Target,
        },
        {
          key: 'push_deal_updates',
          label: 'Deal Updates',
          description: 'CRM deal stage changes',
          icon: Target,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {notificationGroups.map((group) => (
        <Card key={group.title} className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <group.icon className="w-5 h-5 text-violet-500" />
              {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mt-0.5">
                    <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[item.key]}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={() => updateMutation.mutate(preferences)}
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function IntegrationSettings({
  user: _user,
  socialAccounts,
  queryClient: _queryClient,
  toast: _toast,
}) {
  const integrations = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: TwitterIcon,
      color: 'bg-gray-900',
      connected: socialAccounts.some((a) => a.platform === 'twitter'),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: LinkedInIcon,
      color: 'bg-blue-600',
      connected: socialAccounts.some((a) => a.platform === 'linkedin'),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'bg-blue-500',
      connected: socialAccounts.some((a) => a.platform === 'facebook'),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: InstagramIcon,
      color: 'bg-gradient-to-br from-purple-600 to-orange-400',
      connected: socialAccounts.some((a) => a.platform === 'instagram'),
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: YouTubeIcon,
      color: 'bg-red-600',
      connected: socialAccounts.some((a) => a.platform === 'youtube'),
    },
  ];

  const emailIntegrations = [
    { id: 'resend', name: 'Resend', description: 'Transactional email service', connected: true },
  ];

  return (
    <div className="space-y-6">
      {/* Social Media Integrations */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>Social Media Accounts</CardTitle>
          <CardDescription>
            Connect your social media accounts for analytics and publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => {
              const connectedAccount = socialAccounts.find((a) => a.platform === integration.id);
              return (
                <div
                  key={integration.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    integration.connected
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center`}
                    >
                      <integration.icon className="w-5 h-5 text-white" />
                    </div>
                    {integration.connected && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                  {connectedAccount && (
                    <p className="text-sm text-gray-500 mt-1">@{connectedAccount.account_name}</p>
                  )}
                  <Button
                    variant={integration.connected ? 'outline' : 'default'}
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => (window.location.href = '/SocialMedia')}
                  >
                    {integration.connected ? 'Manage' : 'Connect'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Email & Other Integrations */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>Email & Services</CardTitle>
          <CardDescription>Connected email and third-party services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emailIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                  <Check className="w-3 h-3 mr-1" />
                  Configured
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function APIKeySettings({ user, queryClient, toast }) {
  const [showKey, setShowKey] = useState({});
  const [newKeyName, setNewKeyName] = useState('');
  const [keys, setKeys] = useState(user?.api_keys || []);

  const generateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key:
        'ca_' +
        Array.from(
          { length: 32 },
          () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
        ).join(''),
      created: new Date().toISOString(),
      lastUsed: null,
    };
    setKeys([...keys, newKey]);
    setNewKeyName('');
    toast.success('API key generated');
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const deleteKey = (id) => {
    setKeys(keys.filter((k) => k.id !== id));
    toast.success('API key deleted');
  };

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ api_keys: keys }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('API keys saved');
    },
    onError: () => toast.error('Failed to save API keys'),
  });

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for external integrations and automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate New Key */}
          <div className="flex gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production, Development)"
              className="flex-1"
            />
            <Button onClick={generateKey} className="gap-2">
              <Plus className="w-4 h-4" />
              Generate Key
            </Button>
          </div>

          <Separator />

          {/* Existing Keys */}
          {keys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No API keys generated yet</p>
              <p className="text-sm mt-1">Create an API key to integrate with external services</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{apiKey.name}</p>
                      <p className="text-xs text-gray-500">
                        Created {new Date(apiKey.created).toLocaleDateString()}
                        {apiKey.lastUsed &&
                          ` • Last used ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowKey({ ...showKey, [apiKey.id]: !showKey[apiKey.id] })}
                      >
                        {showKey[apiKey.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyKey(apiKey.key)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKey(apiKey.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 font-mono text-sm">
                    {showKey[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {keys.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Learn how to use the CatchAll API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Use your API key to authenticate requests to the CatchAll API:
            </p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
              {`curl -X GET "https://api.catchall.io/v1/contacts" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
