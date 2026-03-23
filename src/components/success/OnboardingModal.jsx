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
import { Loader2, Plus, X } from 'lucide-react';

export default function OnboardingModal({ open, onClose, contacts, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    contact_id: '',
    target_completion_date: '',
    csm_assigned: '',
    milestones: [
      { name: 'Kickoff Call', completed: false },
      { name: 'System Setup', completed: false },
      { name: 'Training Session', completed: false },
      { name: 'First Use Case', completed: false },
      { name: 'Go-Live', completed: false },
    ],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: 'in_progress',
      progress_percentage: 0,
      start_date: new Date().toISOString().slice(0, 10),
    });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { name: '', completed: false }],
    });
  };

  const removeMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  const updateMilestone = (index, value) => {
    const updated = [...formData.milestones];
    updated[index] = { ...updated[index], name: value };
    setFormData({ ...formData, milestones: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start Customer Onboarding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Completion Date</Label>
              <Input
                type="date"
                value={formData.target_completion_date}
                onChange={(e) =>
                  setFormData({ ...formData, target_completion_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>CSM Assigned</Label>
              <Input
                value={formData.csm_assigned}
                onChange={(e) => setFormData({ ...formData, csm_assigned: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Milestones</Label>
              <Button type="button" size="sm" variant="outline" onClick={addMilestone}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={milestone.name}
                    onChange={(e) => updateMilestone(index, e.target.value)}
                    placeholder="Milestone name"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMilestone(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.contact_id || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Onboarding
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
