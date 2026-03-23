import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Plus, Trash2, Eye, Download, Clock, DollarSign, Mail, Loader2 } from 'lucide-react';

export default function AlertsManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [alertForm, setAlertForm] = useState({
    name: '',
    description: '',
    document_id: '',
    trigger_type: 'view_threshold',
    trigger_config: {},
    notification_channels: ['in_app'],
  });
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['docutrace-alerts'],
    queryFn: () => base44.entities.DocuTraceAlert.list('-created_date'),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['tracked-documents'],
    queryFn: () => base44.entities.TrackedDocument.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocuTraceAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docutrace-alerts'] });
      setShowCreate(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocuTraceAlert.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docutrace-alerts'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.DocuTraceAlert.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docutrace-alerts'] });
    },
  });

  const checkNowMutation = useMutation({
    mutationFn: () => base44.functions.invoke('checkDocuTraceAlerts', {}),
  });

  const resetForm = () => {
    setAlertForm({
      name: '',
      description: '',
      document_id: '',
      trigger_type: 'view_threshold',
      trigger_config: {},
      notification_channels: ['in_app'],
    });
  };

  const handleSubmit = () => {
    createMutation.mutate(alertForm);
  };

  const getTriggerIcon = (type) => {
    switch (type) {
      case 'specific_contact_view':
        return Eye;
      case 'view_threshold':
        return Eye;
      case 'download_threshold':
        return Download;
      case 'expiration_warning':
        return Clock;
      case 'high_value_deal_view':
        return DollarSign;
      default:
        return Bell;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Document Alerts
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => checkNowMutation.mutate()}
              disabled={checkNowMutation.isPending}
            >
              {checkNowMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Check Now'
              )}
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Alert
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No alerts configured yet</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getTriggerIcon(alert.trigger_type);
              return (
                <div key={alert.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{alert.name}</h4>
                        {alert.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {alert.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: alert.id, is_active: checked })
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(alert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {alert.trigger_type.replace(/_/g, ' ')}
                    </Badge>
                    {alert.notification_channels.map((ch) => (
                      <Badge
                        key={ch}
                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                      >
                        {ch === 'email' ? (
                          <Mail className="w-3 h-3 mr-1" />
                        ) : (
                          <Bell className="w-3 h-3 mr-1" />
                        )}
                        {ch}
                      </Badge>
                    ))}
                    {alert.trigger_count > 0 && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                        Triggered {alert.trigger_count}x
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Alert Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Document Alert</DialogTitle>
              <DialogDescription>
                Set up automated notifications for document events
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Alert Name</label>
                <Input
                  value={alertForm.name}
                  onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                  placeholder="High-value deal document viewed"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  value={alertForm.description}
                  onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                  placeholder="Alert description"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Document (Optional)</label>
                <Select
                  value={alertForm.document_id}
                  onValueChange={(val) => setAlertForm({ ...alertForm, document_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All documents</SelectItem>
                    {documents.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trigger Type</label>
                <Select
                  value={alertForm.trigger_type}
                  onValueChange={(val) =>
                    setAlertForm({ ...alertForm, trigger_type: val, trigger_config: {} })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="specific_contact_view">Specific Contact View</SelectItem>
                    <SelectItem value="view_threshold">View Threshold</SelectItem>
                    <SelectItem value="download_threshold">Download Threshold</SelectItem>
                    <SelectItem value="expiration_warning">Expiration Warning</SelectItem>
                    <SelectItem value="high_value_deal_view">High-Value Deal View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trigger Configuration */}
              {alertForm.trigger_type === 'specific_contact_view' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Contact Emails (comma-separated)
                  </label>
                  <Input
                    placeholder="john@example.com, jane@example.com"
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        trigger_config: {
                          contact_emails: e.target.value.split(',').map((e) => e.trim()),
                        },
                      })
                    }
                  />
                </div>
              )}

              {alertForm.trigger_type === 'view_threshold' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">View Threshold</label>
                  <Input
                    type="number"
                    placeholder="10"
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        trigger_config: { view_threshold: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              {alertForm.trigger_type === 'download_threshold' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Download Threshold</label>
                  <Input
                    type="number"
                    placeholder="5"
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        trigger_config: { download_threshold: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              {alertForm.trigger_type === 'expiration_warning' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Days Before Expiration</label>
                  <Input
                    type="number"
                    placeholder="7"
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        trigger_config: { days_before_expiration: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              {alertForm.trigger_type === 'high_value_deal_view' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Deal Value Threshold ($)</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        trigger_config: { deal_value_threshold: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Notification Channels</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertForm.notification_channels.includes('in_app')}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...alertForm.notification_channels, 'in_app']
                          : alertForm.notification_channels.filter((c) => c !== 'in_app');
                        setAlertForm({ ...alertForm, notification_channels: channels });
                      }}
                    />
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">In-App Notification</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertForm.notification_channels.includes('email')}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...alertForm.notification_channels, 'email']
                          : alertForm.notification_channels.filter((c) => c !== 'email');
                        setAlertForm({ ...alertForm, notification_channels: channels });
                      }}
                    />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email Notification</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !alertForm.name ||
                  alertForm.notification_channels.length === 0 ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Alert'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
