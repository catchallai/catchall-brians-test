import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Plus, Trash2, Edit, Mail, Play, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function AlertsManager({ initialFilters = null }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [alertForm, setAlertForm] = useState({
    name: '',
    description: '',
    criteria: initialFilters || {},
    trigger_events: [],
    notification_channels: ['in_app'],
    monitored_companies: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['aerospace-alerts'],
    queryFn: () => base44.entities.AerospaceAlert.list('-created_date', 50),
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.AerospaceAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-alerts'] });
      setShowCreateDialog(false);
      resetForm();
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AerospaceAlert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-alerts'] });
      setEditingAlert(null);
      resetForm();
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.AerospaceAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-alerts'] });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AerospaceAlert.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-alerts'] });
    },
  });

  const resetForm = () => {
    setAlertForm({
      name: '',
      description: '',
      criteria: {},
      trigger_events: [],
      notification_channels: ['in_app'],
      monitored_companies: [],
    });
    setNewKeyword('');
  };

  const handleCreate = () => {
    createAlertMutation.mutate(alertForm);
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setAlertForm({
      name: alert.name,
      description: alert.description || '',
      criteria: alert.criteria || {},
      trigger_events: alert.trigger_events || [],
      notification_channels: alert.notification_channels || ['in_app'],
      monitored_companies: alert.monitored_companies || [],
    });
    setShowCreateDialog(true);
  };

  const handleUpdate = () => {
    updateAlertMutation.mutate({
      id: editingAlert.id,
      data: alertForm,
    });
  };

  const toggleEvent = (event) => {
    setAlertForm((prev) => ({
      ...prev,
      trigger_events: prev.trigger_events.includes(event)
        ? prev.trigger_events.filter((e) => e !== event)
        : [...prev.trigger_events, event],
    }));
  };

  const toggleChannel = (channel) => {
    setAlertForm((prev) => ({
      ...prev,
      notification_channels: prev.notification_channels.includes(channel)
        ? prev.notification_channels.filter((c) => c !== channel)
        : [...prev.notification_channels, channel],
    }));
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) {
      return;
    }
    const keywords = alertForm.criteria.keywords || [];
    setAlertForm((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        keywords: [...keywords, newKeyword.trim()],
      },
    }));
    setNewKeyword('');
  };

  const removeKeyword = (keyword) => {
    setAlertForm((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        keywords: (prev.criteria.keywords || []).filter((k) => k !== keyword),
      },
    }));
  };

  React.useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setAlertForm((prev) => ({ ...prev, criteria: initialFilters }));
      setShowCreateDialog(true);
    }
  }, [initialFilters]);

  const checkAlertsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('checkAerospaceAlerts', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-alerts'] });
      toast.success(
        `Alert check complete! ${response.data.notifications_sent} notifications sent.`
      );
    },
  });

  const eventLabels = {
    new_company: 'New Company Added',
    contract_win: 'Major Contract Win',
    funding_round: 'Funding Round',
    negative_pr: 'Negative PR/Incident',
    sentiment_change: 'Sentiment Change',
    data_update: 'Company Data Updated',
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Active Alerts
            <Badge>{alerts.filter((a) => a.is_active).length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => checkAlertsMutation.mutate()}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={checkAlertsMutation.isPending}
            >
              <Play className="w-3 h-3" />
              Check Now
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Alert
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No alerts configured yet</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{alert.name}</h4>
                    {alert.notification_channels?.includes('email') && (
                      <Mail className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                  {alert.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {alert.description}
                    </p>
                  )}
                  {alert.trigger_events?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {alert.trigger_events.map((event, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {eventLabels[event]}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {alert.trigger_count > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Triggered {alert.trigger_count} times
                      {alert.last_triggered &&
                        ` • Last: ${new Date(alert.last_triggered).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={(checked) =>
                      toggleAlertMutation.mutate({ id: alert.id, is_active: checked })
                    }
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(alert)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingAlert(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'Edit Alert' : 'Create Alert'}</DialogTitle>
            <DialogDescription>
              Set up notifications for companies matching your criteria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Alert Name</Label>
              <Input
                placeholder="e.g., High Growth Companies"
                value={alertForm.name}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of this alert"
                value={alertForm.description}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label className="mb-2 block">Trigger Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(eventLabels).map(([event, label]) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      checked={alertForm.trigger_events.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    <label className="text-sm">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Notification Channels</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={alertForm.notification_channels.includes('in_app')}
                    onCheckedChange={() => toggleChannel('in_app')}
                  />
                  <label className="text-sm">In-App</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={alertForm.notification_channels.includes('email')}
                    onCheckedChange={() => toggleChannel('email')}
                  />
                  <label className="text-sm">Email</label>
                </div>
              </div>
            </div>

            {/* Keywords for monitoring */}
            <div>
              <Label>Keywords to Monitor</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g., acquisition, partnership, IPO"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={addKeyword} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {alertForm.criteria.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {alertForm.criteria.keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sentiment change threshold */}
            {alertForm.trigger_events.includes('sentiment_change') && (
              <div>
                <Label>Sentiment Change Threshold</Label>
                <Input
                  type="number"
                  placeholder="20"
                  value={alertForm.criteria.sentiment_change_threshold || ''}
                  onChange={(e) =>
                    setAlertForm((prev) => ({
                      ...prev,
                      criteria: {
                        ...prev.criteria,
                        sentiment_change_threshold: parseInt(e.target.value) || 20,
                      },
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when sentiment score changes by this amount
                </p>
              </div>
            )}

            {Object.keys(alertForm.criteria).length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Label className="mb-2 block">Filter Criteria</Label>
                <div className="text-xs space-y-1">
                  {Object.entries(alertForm.criteria).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                      return null;
                    }
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                        <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingAlert(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingAlert ? handleUpdate : handleCreate}>
              {editingAlert ? 'Update' : 'Create'} Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
