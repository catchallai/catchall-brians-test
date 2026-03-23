import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Plus, Trash2, Zap, TrendingUp, Eye, Target, User, Sparkles } from 'lucide-react';

export default function NotificationRulesModal({ open, onClose }) {
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger_type: 'hot_lead_detected',
    conditions: {},
    notification_channels: ['in_app'],
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['visitor-notification-rules'],
    queryFn: () => base44.entities.VisitorNotificationRule.list('-created_date', 50),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.VisitorNotificationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-notification-rules'] });
      setShowAddRule(false);
      setNewRule({
        name: '',
        description: '',
        trigger_type: 'hot_lead_detected',
        conditions: {},
        notification_channels: ['in_app'],
        is_active: true,
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.VisitorNotificationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-notification-rules'] });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, is_active }) =>
      base44.entities.VisitorNotificationRule.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-notification-rules'] });
    },
  });

  const getTriggerIcon = (type) => {
    switch (type) {
      case 'hot_lead_detected':
        return <Sparkles className="w-4 h-4 text-red-500" />;
      case 'score_threshold':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'score_increase':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'high_engagement':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'return_visitor':
        return <User className="w-4 h-4 text-amber-500" />;
      case 'high_intent_page':
        return <Zap className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleCreateRule = () => {
    createRuleMutation.mutate(newRule);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-500" />
            Notification Rules
          </DialogTitle>
          <DialogDescription>
            Set up automatic notifications for visitor activity and lead scoring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!showAddRule ? (
            <>
              <Button onClick={() => setShowAddRule(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New Rule
              </Button>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id} className="bg-white dark:bg-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            {getTriggerIcon(rule.trigger_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {rule.name}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {rule.trigger_type.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {rule.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>Triggered {rule.trigger_count || 0} times</span>
                              {rule.notification_channels?.includes('email') && (
                                <Badge variant="outline" className="text-xs">
                                  Email
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) =>
                              toggleRuleMutation.mutate({ id: rule.id, is_active: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {rules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No notification rules yet. Create one to get started.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  placeholder="e.g., Hot Lead Alert"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Describe when this rule triggers"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Trigger Type</Label>
                <Select
                  value={newRule.trigger_type}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, trigger_type: value, conditions: {} })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot_lead_detected">🔥 Hot Lead Detected</SelectItem>
                    <SelectItem value="score_threshold">🎯 Score Above Threshold</SelectItem>
                    <SelectItem value="score_increase">📈 Score Increased By</SelectItem>
                    <SelectItem value="high_engagement">👁️ High Engagement</SelectItem>
                    <SelectItem value="return_visitor">🔄 Return Visitor</SelectItem>
                    <SelectItem value="high_intent_page">⚡ High Intent Page Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional inputs based on trigger type */}
              {newRule.trigger_type === 'score_threshold' && (
                <div>
                  <Label>Minimum Score</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 85"
                    value={newRule.conditions.min_score || ''}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        conditions: { ...newRule.conditions, min_score: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              {newRule.trigger_type === 'score_increase' && (
                <div>
                  <Label>Score Increase Amount</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 20"
                    value={newRule.conditions.score_increase || ''}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        conditions: {
                          ...newRule.conditions,
                          score_increase: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              )}

              {newRule.trigger_type === 'high_engagement' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Min Pages Viewed</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 8"
                      value={newRule.conditions.min_pages || ''}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          conditions: {
                            ...newRule.conditions,
                            min_pages: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Min Time (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 10"
                      value={newRule.conditions.min_time_minutes || ''}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          conditions: {
                            ...newRule.conditions,
                            min_time_minutes: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Notification Channels</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={
                      newRule.notification_channels.includes('in_app') ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      const channels = newRule.notification_channels.includes('in_app')
                        ? newRule.notification_channels.filter((c) => c !== 'in_app')
                        : [...newRule.notification_channels, 'in_app'];
                      setNewRule({ ...newRule, notification_channels: channels });
                    }}
                  >
                    In-App
                  </Button>
                  <Button
                    variant={
                      newRule.notification_channels.includes('email') ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      const channels = newRule.notification_channels.includes('email')
                        ? newRule.notification_channels.filter((c) => c !== 'email')
                        : [...newRule.notification_channels, 'email'];
                      setNewRule({ ...newRule, notification_channels: channels });
                    }}
                  >
                    Email
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddRule(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRule}
                  disabled={!newRule.name || createRuleMutation.isPending}
                  className="flex-1"
                >
                  Create Rule
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
