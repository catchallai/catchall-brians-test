import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const TRIGGERS = [
  {
    id: 'deal_stage_change',
    label: 'Deal Stage Changed',
    hasValue: true,
    values: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
  },
  { id: 'contact_created', label: 'Contact Created', hasValue: false },
  {
    id: 'contact_status_change',
    label: 'Contact Status Changed',
    hasValue: true,
    values: ['lead', 'prospect', 'customer', 'churned'],
  },
  {
    id: 'activity_completed',
    label: 'Activity Completed',
    hasValue: true,
    values: ['call', 'email', 'meeting', 'task', 'note'],
  },
  { id: 'email_opened', label: 'Email Opened', hasValue: false },
  { id: 'email_clicked', label: 'Email Link Clicked', hasValue: false },
  { id: 'lead_score_threshold', label: 'Lead Score Threshold', hasValue: true, isNumber: true },
];

const ACTIONS = [
  { id: 'create_task', label: 'Create Task', fields: ['task_title', 'task_type', 'task_priority'] },
  { id: 'send_email', label: 'Send Email', fields: ['email_template'] },
  { id: 'update_contact', label: 'Update Contact Status', fields: ['new_status'] },
  { id: 'add_tag', label: 'Add Tag', fields: ['tag_name'] },
  { id: 'notify', label: 'Send Notification', fields: ['notification_message'] },
];

export default function AutomationRuleModal({ open, onClose, rule, templates, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: '',
    trigger_value: '',
    action_type: '',
    action_config: {},
    is_active: true,
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        trigger_type: rule.trigger_type || '',
        trigger_value: rule.trigger_value || '',
        action_type: rule.action_type || '',
        action_config: rule.action_config || {},
        is_active: rule.is_active !== false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        trigger_type: '',
        trigger_value: '',
        action_type: '',
        action_config: {},
        is_active: true,
      });
    }
  }, [rule, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const selectedTrigger = TRIGGERS.find((t) => t.id === formData.trigger_type);

  const updateActionConfig = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      action_config: { ...prev.action_config, [field]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Automation Rule' : 'Create Automation Rule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rule Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome new contacts"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this automation do?"
              rows={2}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">When this happens...</h4>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, trigger_type: value, trigger_value: '' })
                }
              >
                <SelectTrigger>
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

            {selectedTrigger?.hasValue && (
              <div className="space-y-2">
                <Label>{selectedTrigger.isNumber ? 'Threshold Value' : 'Specific Value'}</Label>
                {selectedTrigger.isNumber ? (
                  <Input
                    type="number"
                    value={formData.trigger_value}
                    onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                    placeholder="e.g., 50"
                  />
                ) : (
                  <Select
                    value={formData.trigger_value}
                    onValueChange={(value) => setFormData({ ...formData, trigger_value: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTrigger.values?.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-violet-50 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">Do this...</h4>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={formData.action_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, action_type: value, action_config: {} })
                }
              >
                <SelectTrigger>
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

            {formData.action_type === 'create_task' && (
              <>
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input
                    value={formData.action_config.task_title || ''}
                    onChange={(e) => updateActionConfig('task_title', e.target.value)}
                    placeholder="e.g., Follow up with {{contact_name}}"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select
                      value={formData.action_config.task_type || ''}
                      onValueChange={(value) => updateActionConfig('task_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.action_config.task_priority || ''}
                      onValueChange={(value) => updateActionConfig('task_priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {formData.action_type === 'send_email' && (
              <div className="space-y-2">
                <Label>Email Template</Label>
                <Select
                  value={formData.action_config.email_template || ''}
                  onValueChange={(value) => updateActionConfig('email_template', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.action_type === 'update_contact' && (
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={formData.action_config.new_status || ''}
                  onValueChange={(value) => updateActionConfig('new_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.action_type === 'add_tag' && (
              <div className="space-y-2">
                <Label>Tag Name</Label>
                <Input
                  value={formData.action_config.tag_name || ''}
                  onChange={(e) => updateActionConfig('tag_name', e.target.value)}
                  placeholder="e.g., hot-lead"
                />
              </div>
            )}

            {formData.action_type === 'notify' && (
              <div className="space-y-2">
                <Label>Notification Message</Label>
                <Textarea
                  value={formData.action_config.notification_message || ''}
                  onChange={(e) => updateActionConfig('notification_message', e.target.value)}
                  placeholder="e.g., New high-value deal created!"
                  rows={2}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.trigger_type || !formData.action_type}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
