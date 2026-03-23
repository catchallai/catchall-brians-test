import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TRIGGERS = [
  { id: 'days_in_stage', label: 'Days in stage', type: 'number' },
  { id: 'deal_value', label: 'Deal value exceeds', type: 'number' },
  { id: 'no_activity', label: 'No activity for (days)', type: 'number' },
];

const ACTIONS = [
  { id: 'move_stage', label: 'Move to stage', requiresValue: true },
  { id: 'increase_probability', label: 'Increase probability by %', requiresValue: true },
  { id: 'decrease_probability', label: 'Decrease probability by %', requiresValue: true },
  { id: 'send_notification', label: 'Send notification', requiresValue: false },
];

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

export default function DealAutomationRules({ businessId }) {
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: '',
    trigger_value: '',
    action_type: '',
    action_value: '',
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automation-rules', businessId],
    queryFn: async () => {
      if (!businessId) {
        return [];
      }
      const automationRules = await base44.entities.AutomationRule.filter({
        business_id: businessId,
        entity_type: 'deal',
      });
      return automationRules;
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.AutomationRule.create({
        ...data,
        business_id: businessId,
        entity_type: 'deal',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowModal(false);
      setFormData({
        name: '',
        trigger_type: '',
        trigger_value: '',
        action_type: '',
        action_value: '',
        is_active: true,
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowModal(false);
      setEditingRule(null);
      setFormData({
        name: '',
        trigger_type: '',
        trigger_value: '',
        action_type: '',
        action_value: '',
        is_active: true,
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  const handleSaveRule = () => {
    if (!formData.name || !formData.trigger_type || !formData.action_type) {
      return;
    }

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowModal(true);
  };

  const getTriggerLabel = (triggerId) =>
    TRIGGERS.find((t) => t.id === triggerId)?.label || triggerId;
  const getActionLabel = (actionId) => ACTIONS.find((a) => a.id === actionId)?.label || actionId;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Deal Stage Automation
        </CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setShowModal(true);
            setEditingRule(null);
            setFormData({
              name: '',
              trigger_type: '',
              trigger_value: '',
              action_type: '',
              action_value: '',
              is_active: true,
            });
          }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </CardHeader>

      <CardContent>
        {rules.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No automation rules yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{rule.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    When {getTriggerLabel(rule.trigger_type)} {rule.trigger_value} →{' '}
                    {getActionLabel(rule.action_type)} {rule.action_value}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.is_active ? 'default' : 'outline'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleEditRule(rule)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Rule Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Automation Rule'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rule Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Auto-advance qualified deals"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Trigger *</label>
              <Select
                value={formData.trigger_type}
                onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type && (
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input
                  type="number"
                  value={formData.trigger_value}
                  onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                  placeholder="Enter value"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Action *</label>
              <Select
                value={formData.action_type}
                onValueChange={(v) => setFormData({ ...formData, action_type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.action_type === 'move_stage' && (
              <div>
                <label className="text-sm font-medium">Target Stage</label>
                <Select
                  value={formData.action_value}
                  onValueChange={(v) => setFormData({ ...formData, action_value: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.action_type === 'increase_probability' ||
              formData.action_type === 'decrease_probability') && (
              <div>
                <label className="text-sm font-medium">Percentage</label>
                <Input
                  type="number"
                  value={formData.action_value}
                  onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                  placeholder="e.g., 10"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
