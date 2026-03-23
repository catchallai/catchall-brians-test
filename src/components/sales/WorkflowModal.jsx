import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

export default function WorkflowModal({ open, onClose, workflow, onSave }) {
  const [formData, setFormData] = useState(
    workflow || {
      name: '',
      trigger_type: 'followup_completed',
      actions: [{ type: 'update_stage', config: {} }],
      is_active: true,
    }
  );

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'update_stage', config: {} }],
    });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    if (field === 'type') {
      newActions[index] = { type: value, config: {} };
    } else {
      newActions[index].config[field] = value;
    }
    setFormData({ ...formData, actions: newActions });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workflow ? 'Edit' : 'Create'} Automation Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Workflow Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Advance deal after positive call"
            />
          </div>

          <div className="space-y-2">
            <Label>Trigger</Label>
            <Select
              value={formData.trigger_type}
              onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followup_completed">Follow-up Completed</SelectItem>
                <SelectItem value="positive_call">Positive Call Sentiment</SelectItem>
                <SelectItem value="negative_call">Negative Call Sentiment</SelectItem>
                <SelectItem value="reservation_confirmed">Reservation Confirmed</SelectItem>
                <SelectItem value="reservation_completed">Reservation Completed</SelectItem>
                <SelectItem value="deal_inactive">Deal Inactive 7+ Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Actions</Label>
              <Button size="sm" variant="outline" onClick={addAction}>
                <Plus className="w-3 h-3 mr-1" />
                Add Action
              </Button>
            </div>

            {formData.actions.map((action, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Action {i + 1}</Badge>
                  {formData.actions.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeAction(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <Select
                  value={action.type}
                  onValueChange={(value) => updateAction(i, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update_stage">Update Deal Stage</SelectItem>
                    <SelectItem value="create_task">Create Task</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="create_followup">Create Follow-up</SelectItem>
                  </SelectContent>
                </Select>

                {action.type === 'update_stage' && (
                  <Input
                    placeholder="New stage (e.g., Negotiation)"
                    value={action.config.new_stage || ''}
                    onChange={(e) => updateAction(i, 'new_stage', e.target.value)}
                  />
                )}

                {action.type === 'create_task' && (
                  <Textarea
                    placeholder="Task description"
                    value={action.config.task_description || ''}
                    onChange={(e) => updateAction(i, 'task_description', e.target.value)}
                  />
                )}

                {action.type === 'send_email' && (
                  <>
                    <Input
                      placeholder="Email subject"
                      value={action.config.email_subject || ''}
                      onChange={(e) => updateAction(i, 'email_subject', e.target.value)}
                    />
                    <Textarea
                      placeholder="Email body"
                      value={action.config.email_body || ''}
                      onChange={(e) => updateAction(i, 'email_body', e.target.value)}
                    />
                  </>
                )}

                {action.type === 'create_followup' && (
                  <>
                    <Input
                      placeholder="Days from now"
                      type="number"
                      value={action.config.days_from_now || 1}
                      onChange={(e) => updateAction(i, 'days_from_now', parseInt(e.target.value))}
                    />
                    <Textarea
                      placeholder="Follow-up action description"
                      value={action.config.action_description || ''}
                      onChange={(e) => updateAction(i, 'action_description', e.target.value)}
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {workflow ? 'Save Changes' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
