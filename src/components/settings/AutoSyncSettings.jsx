import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AutoSyncSettings() {
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['feature-settings'],
    queryFn: () => base44.entities.FeatureSettings.list(),
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['auto-sync-logs'],
    queryFn: () => base44.entities.AutoSyncLog.list('-created_date', 10),
  });

  const autoSyncEnabled =
    settings?.find((s) => s.feature_key === 'auto_sync_social')?.enabled || false;
  const lastSync = syncLogs[0];

  const toggleAutoSyncMutation = useMutation({
    mutationFn: async (enabled) => {
      const existing = settings?.find((s) => s.feature_key === 'auto_sync_social');
      if (existing) {
        await base44.entities.FeatureSettings.update(existing.id, { enabled });
      } else {
        await base44.entities.FeatureSettings.create({
          feature_key: 'auto_sync_social',
          feature_name: 'Auto-Sync Social Media',
          enabled,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-settings'] });
      toast.success('Auto-sync settings updated');
    },
  });

  const manualSyncMutation = useMutation({
    mutationFn: async () => {
      setIsManualSyncing(true);
      const startTime = Date.now();

      const result = await base44.functions.invoke('autoSyncSocial', {});

      const duration = Date.now() - startTime;

      // Log the sync
      await base44.entities.AutoSyncLog.create({
        sync_type: 'social',
        status:
          result.data.failed === 0 ? 'success' : result.data.synced > 0 ? 'partial' : 'failed',
        total_items: result.data.total,
        synced: result.data.synced,
        failed: result.data.failed,
        errors: result.data.errors || [],
        duration_ms: duration,
        next_run: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      });

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setIsManualSyncing(false);
      toast.success(`Synced ${data.synced} accounts successfully`);
    },
    onError: () => {
      setIsManualSyncing(false);
      toast.error('Sync failed');
    },
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-violet-600" />
          Auto-Sync Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Auto-Sync Social Media</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically sync all social accounts every 3 hours
            </p>
          </div>
          <Switch
            checked={autoSyncEnabled}
            onCheckedChange={(checked) => toggleAutoSyncMutation.mutate(checked)}
            disabled={toggleAutoSyncMutation.isPending}
          />
        </div>

        {/* Last Sync Info */}
        {lastSync && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Last Sync</h4>
              <Badge
                className={
                  lastSync.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : lastSync.status === 'partial'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }
              >
                {lastSync.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-lg font-bold text-blue-600">{lastSync.total_items}</p>
              </div>
              <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                <p className="text-xs text-gray-500 mb-1">Synced</p>
                <p className="text-lg font-bold text-emerald-600">{lastSync.synced}</p>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <p className="text-xs text-gray-500 mb-1">Failed</p>
                <p className="text-lg font-bold text-red-600">{lastSync.failed}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(lastSync.created_date).toLocaleString()}
              </span>
              <span>{(lastSync.duration_ms / 1000).toFixed(1)}s</span>
            </div>

            {lastSync.errors && lastSync.errors.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Errors:</p>
                {lastSync.errors.slice(0, 3).map((err, idx) => (
                  <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                    {err.account}: {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Next Sync */}
        {autoSyncEnabled && lastSync?.next_run && (
          <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <Clock className="w-5 h-5 text-violet-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Next sync in</p>
              <p className="text-xs text-gray-500">
                {new Date(lastSync.next_run).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Manual Sync */}
        <Button
          onClick={() => manualSyncMutation.mutate()}
          disabled={isManualSyncing}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {isManualSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" /> Run Manual Sync
            </>
          )}
        </Button>

        {/* Sync History */}
        {syncLogs.length > 1 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Syncs</h4>
            <div className="space-y-2">
              {syncLogs.slice(1, 6).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(log.created_date).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {log.synced}/{log.total_items}
                    </span>
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
