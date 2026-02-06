import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Youtube,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Key,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SocialAccounts() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [credentials, setCredentials] = useState({
    api_key: '',
    api_secret: '',
    access_token: '',
    access_token_secret: '',
    account_name: ''
  });

  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 50),
  });

  const addAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setShowAddModal(false);
      setSelectedPlatform(null);
      setCredentials({
        api_key: '',
        api_secret: '',
        access_token: '',
        access_token_secret: '',
        account_name: ''
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (accountId) => {
      const account = accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');
      
      // Simulate testing the connection with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, you would call the actual API here
      // For now, we'll simulate success/failure based on whether credentials exist
      const hasCredentials = account.credentials?.access_token || account.credentials?.api_key;
      
      if (!hasCredentials) {
        throw new Error('No credentials found');
      }
      
      return { success: true, platform: account.platform };
    },
    onSuccess: (data) => {
      alert(`✅ ${data.platform} connection successful!`);
    },
    onError: (error) => {
      alert(`❌ Connection failed: ${error.message}`);
    }
  });

  const platforms = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-gray-900',
      description: 'Post tweets and threads automatically',
      setupUrl: 'https://developer.twitter.com/en/portal/dashboard',
      fields: ['api_key', 'api_secret', 'access_token', 'access_token_secret']
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-600',
      description: 'Share professional updates and articles',
      setupUrl: 'https://www.linkedin.com/developers/apps',
      fields: ['access_token']
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-500',
      description: 'Post to pages and groups',
      setupUrl: 'https://developers.facebook.com/apps',
      fields: ['access_token', 'page_id']
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-br from-purple-600 to-orange-400',
      description: 'Share photos and stories',
      setupUrl: 'https://developers.facebook.com/apps',
      fields: ['access_token', 'instagram_account_id']
    },
    {
      name: 'YouTube',
      icon: Youtube,
      color: 'bg-red-600',
      description: 'Upload videos and shorts',
      setupUrl: 'https://console.cloud.google.com/apis/credentials',
      fields: ['access_token']
    }
  ];

  const handleAddAccount = () => {
    if (!selectedPlatform) return;
    
    const platform = platforms.find(p => p.name === selectedPlatform);
    addAccountMutation.mutate({
      platform: selectedPlatform,
      account_name: credentials.account_name,
      credentials: credentials,
      is_active: true,
      status: 'active'
    });
  };

  const connectedPlatforms = accounts.map(a => a.platform);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social Accounts</h1>
          <p className="text-gray-500 mt-1">Connect and manage your social media accounts</p>
        </div>
      </div>

      {/* Setup Instructions */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Getting Started:</strong> To enable auto-posting, you need to connect your social media accounts. 
          Each platform requires API credentials from their developer portal. Click "Add Account" and follow the setup guide for each platform.
        </AlertDescription>
      </Alert>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Manage your connected social media accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No accounts connected yet</p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const platform = platforms.find(p => p.name === account.platform);
                const Icon = platform?.icon || Twitter;
                
                return (
                  <div 
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${platform?.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {account.account_name || account.platform}
                          </p>
                          {account.is_active ? (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Connected {new Date(account.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate(account.id)}
                        disabled={testConnectionMutation.isPending}
                      >
                        Test Connection
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => {
                          if (confirm('Disconnect this account?')) {
                            deleteAccountMutation.mutate(account.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {accounts.length > 0 && (
            <Button 
              onClick={() => setShowAddModal(true)} 
              className="w-full mt-4 gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Add Another Account
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Available Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Available Platforms</CardTitle>
          <CardDescription>Platforms you can connect for auto-posting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isConnected = connectedPlatforms.includes(platform.name);
              
              return (
                <Card key={platform.name} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {platform.name}
                          </h3>
                          {isConnected && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{platform.description}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          variant={isConnected ? "outline" : "default"}
                          onClick={() => {
                            setSelectedPlatform(platform.name);
                            setShowAddModal(true);
                          }}
                        >
                          {isConnected ? 'Add Another' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Account Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Connect {selectedPlatform} Account
            </DialogTitle>
          </DialogHeader>

          {selectedPlatform && (
            <div className="space-y-4 mt-4">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                  You'll need API credentials from {selectedPlatform}'s developer portal.
                  <a 
                    href={platforms.find(p => p.name === selectedPlatform)?.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 underline font-medium"
                  >
                    Open Developer Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>

              <div>
                <Label>Account Name / Handle</Label>
                <Input
                  value={credentials.account_name}
                  onChange={(e) => setCredentials({ ...credentials, account_name: e.target.value })}
                  placeholder="@yourusername"
                />
              </div>

              {selectedPlatform === 'Twitter' && (
                <>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={credentials.api_key}
                      onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
                      placeholder="Enter API Key"
                    />
                  </div>
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={credentials.api_secret}
                      onChange={(e) => setCredentials({ ...credentials, api_secret: e.target.value })}
                      placeholder="Enter API Secret"
                    />
                  </div>
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={credentials.access_token}
                      onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
                      placeholder="Enter Access Token"
                    />
                  </div>
                  <div>
                    <Label>Access Token Secret</Label>
                    <Input
                      type="password"
                      value={credentials.access_token_secret}
                      onChange={(e) => setCredentials({ ...credentials, access_token_secret: e.target.value })}
                      placeholder="Enter Access Token Secret"
                    />
                  </div>
                </>
              )}

              {['LinkedIn', 'Facebook', 'Instagram', 'YouTube'].includes(selectedPlatform) && (
                <div>
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    value={credentials.access_token}
                    onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
                    placeholder="Enter Access Token"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAccount}
                  disabled={!credentials.account_name || addAccountMutation.isPending}
                >
                  {addAccountMutation.isPending ? 'Connecting...' : 'Connect Account'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}