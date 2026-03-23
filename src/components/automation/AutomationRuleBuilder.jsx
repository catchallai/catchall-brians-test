import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit2, Power } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function AutomationRuleBuilder() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'contact_status_change',
    trigger_value: '',
    action_type: 'create_task',
    action_config: { task_title: '', task_description: '' },
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      setDeleteConfirm(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      base44.entities.AutomationRule.update(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'contact_status_change',
      trigger_value: '',
      action_type: 'create_task',
      action_config: { task_title: '', task_description: '' },
      is_active: true,
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const handleEdit = (rule) => {
    setFormData(rule);
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.trigger_value) {
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const triggerOptions = {
    contact_status_change: {
      label: 'Contact Status Change',
      values: ['lead', 'prospect', 'customer', 'churned'],
    },
    opportunity_stage_change: {
      label: 'Opportunity Stage Change',
      values: [
        'new_lead',
        'email_list',
        'media_inquiry',
        'reservation_request',
        'contacted',
        'closed',
      ],
    },
    contact_inactivity: {
      label: 'Contact Inactivity (30 days)',
      values: ['inactive_30days'],
    },
  };

  const triggerConfig = triggerOptions[formData.trigger_type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Rules</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {rule.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    <strong>Trigger:</strong>{' '}
                    {triggerOptions[rule.trigger_type]?.label || rule.trigger_type}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>When:</strong> {rule.trigger_value}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Action:</strong> {rule.action_type}
                  </span>
                  {rule.run_count > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        <strong>Ran:</strong> {rule.run_count} times
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.is_active })}
                  title={rule.is_active ? 'Disable' : 'Enable'}
                >
                  <Power className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(rule)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="glass-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingRule ? 'Edit Rule' : 'Create Rule'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Create Demo Task for Prospects"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Rule description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  When this happens
                </label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trigger_type: value, trigger_value: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact_status_change">Contact Status Changes</SelectItem>
                    <SelectItem value="opportunity_stage_change">
                      Opportunity Stage Changes
                    </SelectItem>
                    <SelectItem value="contact_inactivity">Contact Inactive 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerConfig && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To this value
                  </label>
                  <Select
                    value={formData.trigger_value}
                    onValueChange={(value) => setFormData({ ...formData, trigger_value: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerConfig.values.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Then create this task
                </label>
                <Input
                  value={formData.action_config.task_title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, task_title: e.target.value },
                    })
                  }
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task description (optional)
                </label>
                <Input
                  value={formData.action_config.task_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action_config: {
                        ...formData.action_config,
                        task_description: e.target.value,
                      },
                    })
                  }
                  placeholder="Task description"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        title="Delete Rule"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
