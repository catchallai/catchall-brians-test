import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Eye, EyeOff, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CodeBlock = ({ code, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-4 h-4 text-gray-300" />
        </button>
      </div>
      {copied && <p className="text-xs text-green-500">Copied!</p>}
    </div>
  );
};

const OnboardingGuide = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50">
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2 text-base">
            <AlertCircle className="w-5 h-5" />
            Setup Guide
          </CardTitle>
          <span className="text-sm text-blue-600 dark:text-blue-400">
            {expanded ? '−' : '+'}
          </span>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 text-sm text-blue-900 dark:text-blue-100">
          <div>
            <p className="font-medium mb-2">1. Generate a Tracking Key</p>
            <p className="text-blue-800 dark:text-blue-200">Click "Generate Key" below to create your first tracking key.</p>
          </div>
          <div>
            <p className="font-medium mb-2">2. Copy the Snippet</p>
            <p className="text-blue-800 dark:text-blue-200">
              Use the generated snippet and add it to your website's HTML, just before the closing {"</body>"} tag.
            </p>
          </div>
          <div>
            <p className="font-medium mb-2">3. Verify Installation</p>
            <p className="text-blue-800 dark:text-blue-200">
              Once installed, the key status will change to "Active" when events are detected.
            </p>
          </div>
          <div className="pt-2 border-t border-blue-200 dark:border-blue-900/50">
            <p className="font-medium mb-2">Popular Platforms:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li><strong>WordPress:</strong> Add to theme's header.php</li>
              <li><strong>Shopify:</strong> Add to Online Store → Themes → Edit code</li>
              <li><strong>React:</strong> Add to your index.html or useEffect hook</li>
              <li><strong>Custom:</strong> Place in your page template</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function TrackingModal({ open, onOpenChange }) {
  const [showRevoked, setShowRevoked] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showKeys, setShowKeys] = useState({});
  const queryClient = useQueryClient();

  const { data: trackingKeys = [], isLoading } = useQuery({
    queryKey: ['tracking-keys'],
    queryFn: async () => {
      try {
        const keys = await base44.entities.TrackingKey.list();
        return keys || [];
      } catch (error) {
        return [];
      }
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const key = await base44.entities.TrackingKey.create({
        name: keyName || `Key ${new Date().toLocaleDateString()}`,
        is_active: true,
      });
      return key;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-keys'] });
      setKeyName('');
      toast.success('Tracking key created');
    },
    onError: () => toast.error('Failed to create key'),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.entities.TrackingKey.update(keyId, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-keys'] });
      toast.success('Key revoked');
    },
    onError: () => toast.error('Failed to revoke key'),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.entities.TrackingKey.delete(keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-keys'] });
      toast.success('Key deleted');
    },
    onError: () => toast.error('Failed to delete key'),
  });

  const activeKeys = trackingKeys.filter(k => k.is_active);
  const revokedKeys = trackingKeys.filter(k => !k.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Website Tracking Configuration</DialogTitle>
          <DialogDescription>
            Generate and manage tracking keys for your website
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="setup" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="keys">Manage Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <OnboardingGuide />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="key-name">Key Name (Optional)</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g., Production Website"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => createKeyMutation.mutate()}
                  disabled={createKeyMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Key
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : (
              <>
                {activeKeys.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Active Keys ({activeKeys.length})
                    </h3>
                    {activeKeys.map((key) => (
                      <Card key={key.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {key.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeKeyMutation.mutate(key.id)}
                              disabled={revokeKeyMutation.isPending}
                            >
                              Revoke
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <CodeBlock
                              label="Tracking Key"
                              code={key.id || 'key-value'}
                            />
                            <CodeBlock
                              label="Installation Snippet"
                              code={`<script>
  window.trackingKey = "${key.id || 'KEY'}";
  (function() {
    const s = document.createElement('script');
    s.async = true;
    s.src = '${window.location.origin}/tracking.js';
    document.head.appendChild(s);
  })();
</script>`}
                            />
                          </div>

                          {key.last_event_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                              Last event: {new Date(key.last_event_date).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {revokedKeys.length > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowRevoked(!showRevoked)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {showRevoked ? '−' : '+'} Revoked Keys ({revokedKeys.length})
                    </button>
                    {showRevoked && (
                      <div className="space-y-2">
                        {revokedKeys.map((key) => (
                          <Card key={key.id} className="bg-gray-50 dark:bg-gray-900/20">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                                  Revoked
                                </Badge>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {key.name}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteKeyMutation.mutate(key.id)}
                                disabled={deleteKeyMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {trackingKeys.length === 0 && (
                  <Card className="bg-gray-50 dark:bg-gray-900/20">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        No tracking keys yet. Go to Setup to create one.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}