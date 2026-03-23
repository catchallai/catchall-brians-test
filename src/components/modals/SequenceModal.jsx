import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export default function SequenceModal({ open, onClose, sequence, onSave, isLoading }) {
  const [formData, setFormData] = useState(
    sequence || {
      name: '',
      description: '',
      is_active: true,
      steps: [],
    }
  );

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...(formData.steps || []),
        {
          order: (formData.steps?.length || 0) + 1,
          type: 'email',
          delay_days: 1,
          subject: '',
          body: '',
          notes: '',
        },
      ],
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sequence ? 'Edit Sequence' : 'Create Sequence'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sequence Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., New Lead Outreach"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this sequence for?"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Sequence Steps</h4>
              <Button type="button" onClick={addStep} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            {formData.steps?.map((step, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Step {index + 1}</span>
                  <Button type="button" onClick={() => removeStep(index)} size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">Type</label>
                    <Select
                      value={step.type}
                      onValueChange={(val) => updateStep(index, 'type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="call">Call Task</SelectItem>
                        <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                        <SelectItem value="task">Manual Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm">Delay (days)</label>
                    <Input
                      type="number"
                      value={step.delay_days}
                      onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                {step.type === 'email' && (
                  <>
                    <div>
                      <label className="text-sm">Subject</label>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStep(index, 'subject', e.target.value)}
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Body</label>
                      <Textarea
                        value={step.body}
                        onChange={(e) => updateStep(index, 'body', e.target.value)}
                        placeholder="Email body"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm">Notes</label>
                  <Input
                    value={step.notes}
                    onChange={(e) => updateStep(index, 'notes', e.target.value)}
                    placeholder="Instructions for this step"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {sequence ? 'Update' : 'Create'} Sequence
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
