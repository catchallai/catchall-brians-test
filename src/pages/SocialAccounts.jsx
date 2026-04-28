import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  ArrowLeft,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';

// Platform definitions with icons as SVG/emoji for simplicity
const PLATFORMS = [
  {
    id: 'Instagram',
    name: 'Instagram',
    subtitle: 'Business, Creator, or Personal',
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    letter: '📸',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'access_token', 'instagram_account_id'],
    setupUrl: 'https://developers.facebook.com/apps',
  },
  {
    id: 'Threads',
    name: 'Threads',
    subtitle: 'Profile',
    bg: 'bg-black',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.22 6.22 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'access_token'],
    setupUrl: 'https://developers.facebook.com/docs/threads',
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn',
    subtitle: 'Page or Profile',
    bg: 'bg-blue-600',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    setupType: 'oauth',
    oauthConnector: 'linkedin',
  },
  {
    id: 'Facebook',
    name: 'Facebook',
    subtitle: 'Page or Group',
    bg: 'bg-blue-500',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'access_token', 'page_id'],
    setupUrl: 'https://developers.facebook.com/apps',
  },
  {
    id: 'Twitter',
    name: 'Twitter / X',
    subtitle: 'Profile',
    bg: 'bg-black',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'api_key', 'api_secret', 'access_token', 'access_token_secret'],
    setupUrl: 'https://developer.twitter.com/en/portal/dashboard',
  },
  {
    id: 'YouTube',
    name: 'YouTube',
    subtitle: 'Channel',
    bg: 'bg-red-600',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'access_token'],
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    id: 'TikTok',
    name: 'TikTok',
    subtitle: 'Business or Creator',
    bg: 'bg-black',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.22 6.22 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'access_token'],
    setupUrl: 'https://developers.tiktok.com/',
  },
  {
    id: 'Pinterest',
    name: 'Pinterest',
    subtitle: 'Business or Profile',
    bg: 'bg-red-500',
    svgIcon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
    setupType: 'manual',
    fields: ['account_name', 'access_token'],
    setupUrl: 'https://developers.pinterest.com/',
  },
];

function ConnectChannelModal({ open, onClose, onConnected }) {
  const [step, setStep] = useState('select'); // 'select' | 'configure'
  const [selected, setSelected] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [connecting, setConnecting] = useState(false);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      onConnected?.();
      handleClose();
    },
  });

  const handleClose = () => {
    setStep('select');
    setSelected(null);
    setCredentials({});
    setConnecting(false);
    onClose();
  };

  const selectPlatform = (platform) => {
    setSelected(platform);
    setStep('configure');
  };

  const handleConnect = async () => {
    setConnecting(true);
    if (selected.setupType === 'oauth' && selected.oauthConnector === 'linkedin') {
      try {
        const response = await base44.functions.invoke('verifyLinkedInConnection', {});
        if (response.data?.success) {
          await addMutation.mutateAsync({
            platform: selected.id,
            account_name: response.data.name || credentials.account_name || 'LinkedIn Account',
            connection_type: 'oauth',
            is_active: true,
            status: 'active',
            profile_url: response.data.profileUrl,
          });
        } else {
          throw new Error(response.data?.error || 'OAuth failed');
        }
      } catch (err) {
        toast.error('Connection failed: ' + err.message);
      }
    } else {
      await addMutation.mutateAsync({
        platform: selected.id,
        account_name: credentials.account_name || selected.name,
        credentials,
        connection_type: 'manual',
        is_active: true,
        status: 'active',
      });
    }
    setConnecting(false);
  };

  const isFormValid = () => {
    if (selected?.setupType === 'oauth') {
      return true;
    }
    return !!credentials.account_name;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-xl w-full rounded-2xl overflow-hidden" style={{ gap: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step === 'configure' && (
              <button
                onClick={() => setStep('select')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {step === 'select' ? 'Connect a Channel' : `Connect ${selected?.name}`}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Select platform grid */}
        {step === 'select' && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-5">
              Choose a platform to connect your channel or profile.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => selectPlatform(platform)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all bg-white group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${platform.bg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {platform.svgIcon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800">{platform.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      {platform.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Configure step */}
        {step === 'configure' && selected && (
          <div className="p-6 space-y-5">
            {/* Platform hero */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div
                className={`w-14 h-14 rounded-2xl ${selected.bg} flex items-center justify-center shadow`}
              >
                {selected.svgIcon}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.subtitle}</p>
              </div>
            </div>

            {selected.setupType === 'oauth' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <strong>One-click connect:</strong> Your LinkedIn account is pre-authorized via
                  OAuth. Click below to activate it.
                </div>
                <div>
                  <Label>Display Name (optional)</Label>
                  <Input
                    className="mt-1"
                    placeholder="My LinkedIn Profile"
                    value={credentials.account_name || ''}
                    onChange={(e) =>
                      setCredentials((c) => ({ ...c, account_name: e.target.value }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <span className="mt-0.5">ℹ️</span>
                  <span>
                    You need API credentials from {selected.name}.{' '}
                    {selected.setupUrl && (
                      <a
                        href={selected.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium inline-flex items-center gap-0.5"
                      >
                        Open Developer Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </span>
                </div>

                <div>
                  <Label>Account Name / Handle</Label>
                  <Input
                    className="mt-1"
                    placeholder="@yourusername"
                    value={credentials.account_name || ''}
                    onChange={(e) =>
                      setCredentials((c) => ({ ...c, account_name: e.target.value }))
                    }
                  />
                </div>

                {selected.fields?.includes('api_key') && (
                  <div>
                    <Label>API Key</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      placeholder="Enter API Key"
                      value={credentials.api_key || ''}
                      onChange={(e) => setCredentials((c) => ({ ...c, api_key: e.target.value }))}
                    />
                  </div>
                )}
                {selected.fields?.includes('api_secret') && (
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      placeholder="Enter API Secret"
                      value={credentials.api_secret || ''}
                      onChange={(e) =>
                        setCredentials((c) => ({ ...c, api_secret: e.target.value }))
                      }
                    />
                  </div>
                )}
                {selected.fields?.includes('access_token') && (
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      placeholder="Enter Access Token"
                      value={credentials.access_token || ''}
                      onChange={(e) =>
                        setCredentials((c) => ({ ...c, access_token: e.target.value }))
                      }
                    />
                  </div>
                )}
                {selected.fields?.includes('access_token_secret') && (
                  <div>
                    <Label>Access Token Secret</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      placeholder="Enter Access Token Secret"
                      value={credentials.access_token_secret || ''}
                      onChange={(e) =>
                        setCredentials((c) => ({ ...c, access_token_secret: e.target.value }))
                      }
                    />
                  </div>
                )}
                {selected.fields?.includes('page_id') && (
                  <div>
                    <Label>Page ID</Label>
                    <Input
                      className="mt-1"
                      placeholder="Enter Page ID"
                      value={credentials.page_id || ''}
                      onChange={(e) => setCredentials((c) => ({ ...c, page_id: e.target.value }))}
                    />
                  </div>
                )}
                {selected.fields?.includes('instagram_account_id') && (
                  <div>
                    <Label>Instagram Account ID</Label>
                    <Input
                      className="mt-1"
                      placeholder="Enter Instagram Business Account ID"
                      value={credentials.instagram_account_id || ''}
                      onChange={(e) =>
                        setCredentials((c) => ({ ...c, instagram_account_id: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleConnect}
              disabled={connecting || addMutation.isPending || !isFormValid()}
            >
              {connecting || addMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…
                </>
              ) : (
                <>Connect {selected.name}</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SocialAccounts() {
  const [showModal, setShowModal] = useState(false);
  const [disconnectAccountId, setDisconnectAccountId] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  });

  const getPlatformConfig = (platformId) => PLATFORMS.find((p) => p.id === platformId);

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Channels</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your connected social media accounts
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
          >
            <Plus className="w-4 h-4" />
            Connect Channel
          </Button>
        </div>

        {/* Connected Accounts */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="grid grid-cols-4 gap-2 w-32 mx-auto mb-6 opacity-30">
              {PLATFORMS.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className={`w-7 h-7 rounded-lg ${p.bg} flex items-center justify-center`}
                />
              ))}
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
              No channels connected yet
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Connect your social media accounts to start scheduling posts.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Connect Your First Channel
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const config = getPlatformConfig(account.platform);
              return (
                <div
                  key={account.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${config?.bg || 'bg-gray-400'} flex items-center justify-center flex-shrink-0`}
                  >
                    {config?.svgIcon || (
                      <span className="text-white text-xs font-bold">{account.platform[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {account.account_name || account.platform}
                      </p>
                      <Badge
                        className={
                          account.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {account.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" /> Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" /> Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {config?.name || account.platform} · Connected{' '}
                      {new Date(account.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setDisconnectAccountId(account.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setShowModal(true)}
              className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl text-sm text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Connect another channel
            </button>
          </div>
        )}
      </div>

      <ConnectChannelModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConnected={() => setShowModal(false)}
      />

      <ConfirmDialog
        open={!!disconnectAccountId}
        onClose={() => setDisconnectAccountId(null)}
        onConfirm={() => {
          deleteMutation.mutate(disconnectAccountId);
          setDisconnectAccountId(null);
        }}
        title="Disconnect this channel?"
        description="You can reconnect this channel later if needed."
        confirmLabel="Disconnect"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
