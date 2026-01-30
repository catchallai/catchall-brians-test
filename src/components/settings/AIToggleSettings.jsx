import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

export default function AIToggleSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ['ai-settings-admin'],
    queryFn: async () => {
      const records = await base44.entities.AISettings.list();
      return records[0] || null;
    },
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled) => {
      if (aiSettings) {
        return await base44.entities.AISettings.update(aiSettings.id, {
          ai_enabled: enabled,
          last_toggled_by: user?.email,
          last_toggled_date: new Date().toISOString(),
        });
      } else {
        return await base44.entities.AISettings.create({
          ai_enabled: enabled,
          last_toggled_by: user?.email,
          last_toggled_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      toast.success('AI settings updated');
    },
    onError: () => {
      toast.error('Failed to update AI settings');
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  const isAIEnabled = aiSettings?.ai_enabled ?? true;

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          AI Functions Toggle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-200">Resource Control</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                Disabling AI functions reduces resource usage during development. AI-powered features will be unavailable when turned off.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Enable AI Functions</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All AI-powered features across the platform
            </p>
          </div>
          <Switch
            checked={isAIEnabled}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            disabled={toggleMutation.isPending}
          />
        </div>

        {aiSettings && (
          <div className="pt-4 border-t space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-medium text-gray-900 dark:text-white">Last toggled by:</span> {aiSettings.last_toggled_by}
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-white">Last toggled:</span>{' '}
              {new Date(aiSettings.last_toggled_date).toLocaleString()}
            </p>
            <div className="pt-2">
              <Badge variant={isAIEnabled ? 'default' : 'destructive'}>
                {isAIEnabled ? 'AI Enabled' : 'AI Disabled'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}