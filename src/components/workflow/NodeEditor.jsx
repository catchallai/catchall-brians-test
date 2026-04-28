import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

const ACTION_CONFIG_FIELDS = {
  send_email: {
    fields: [
      {
        key: 'template',
        label: 'Email Template',
        type: 'text',
        placeholder: 'e.g., Follow-up Email',
      },
      {
        key: 'recipient_type',
        label: 'Send To',
        type: 'select',
        options: ['contact', 'owner', 'team_member'],
      },
      {
        key: 'recipient_name',
        label: 'Team Member',
        type: 'text',
        placeholder: 'Optional: specific team member',
        condition: (config) => config.recipient_type === 'team_member',
      },
      { key: 'delay_days', label: 'Delay (days)', type: 'number', placeholder: '0', min: 0 },
    ],
  },
  create_task: {
    fields: [
      {
        key: 'title',
        label: 'Task Title',
        type: 'text',
        placeholder: 'e.g., Follow up with {{contact_name}}',
      },
      {
        key: 'task_type',
        label: 'Task Type',
        type: 'select',
        options: ['call', 'email', 'meeting', 'task'],
      },
      { key: 'assigned_to', label: 'Assign To', type: 'select', options: ['owner', 'team_member'] },
      {
        key: 'assigned_user',
        label: 'Team Member Name',
        type: 'text',
        placeholder: 'Team member name',
        condition: (config) => config.assigned_to === 'team_member',
      },
      { key: 'due_in_days', label: 'Due In (days)', type: 'number', placeholder: '1', min: 0 },
    ],
  },
  update_stage: {
    fields: [
      {
        key: 'new_stage',
        label: 'New Stage',
        type: 'select',
        options: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      },
    ],
  },
  create_followup: {
    fields: [
      {
        key: 'type',
        label: 'Followup Type',
        type: 'select',
        options: ['call', 'email', 'meeting', 'task'],
      },
      {
        key: 'assigned_to',
        label: 'Assigned To',
        type: 'select',
        options: ['owner', 'team_member'],
      },
      {
        key: 'assigned_user',
        label: 'Team Member Name',
        type: 'text',
        placeholder: 'Team member name',
        condition: (config) => config.assigned_to === 'team_member',
      },
      {
        key: 'scheduled_days',
        label: 'Schedule In (days)',
        type: 'number',
        placeholder: '3',
        min: 0,
      },
    ],
  },
  notify: {
    fields: [
      {
        key: 'message',
        label: 'Notification Message',
        type: 'textarea',
        placeholder: 'e.g., New high-value deal!',
      },
      {
        key: 'notify_team',
        label: 'Notify',
        type: 'select',
        options: ['owner', 'team', 'specific'],
      },
      {
        key: 'notify_user',
        label: 'Team Member',
        type: 'text',
        placeholder: 'Optional: specific team member',
        condition: (config) => config.notify_team === 'specific',
      },
    ],
  },
};

export default function NodeEditor({ node, nodeIndex, onUpdate, onClose }) {
  const [config, setConfig] = useState(node?.config || {});
  const actionType = node?.type;
  const fields = ACTION_CONFIG_FIELDS[actionType]?.fields || [];

  useEffect(() => {
    setConfig(node?.config || {});
  }, [node]);

  const handleFieldChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(nodeIndex, { ...node, config: newConfig });
  };

  return (
    <Card className="w-96 border-violet-200 dark:border-violet-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm capitalize">{actionType?.replace(/_/g, ' ')}</CardTitle>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const shouldShow = !field.condition || field.condition(config);
          if (!shouldShow) {
            return null;
          }

          return (
            <div key={field.key} className="space-y-2">
              <Label className="text-xs">{field.label}</Label>
              {field.type === 'select' && (
                <Select
                  value={config[field.key] || ''}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type === 'textarea' && (
                <Textarea
                  value={config[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={2}
                  className="text-xs"
                />
              )}
              {field.type === 'number' && (
                <Input
                  type="number"
                  min={field.min || 0}
                  value={config[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 text-xs"
                />
              )}
              {field.type === 'text' && (
                <Input
                  type="text"
                  value={config[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 text-xs"
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
