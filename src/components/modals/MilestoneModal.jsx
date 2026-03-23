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
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function MilestoneModal({ open, onClose, milestone, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    status: 'pending',
    deliverables: [],
  });
  const [errors, setErrors] = useState({});
  const [deliverable, setDeliverable] = useState('');

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name || '',
        description: milestone.description || '',
        due_date: milestone.due_date || '',
        status: milestone.status || 'pending',
        deliverables: milestone.deliverables || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        due_date: '',
        status: 'pending',
        deliverables: [],
      });
    }
  }, [milestone, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      setErrors({ name: 'Milestone name is required' });
      return;
    }
    if (!formData.due_date) {
      setErrors({ due_date: 'Due date is required' });
      return;
    }
    setErrors({});
    onSave(formData);
  };

  const addDeliverable = () => {
    if (deliverable.trim()) {
      setFormData({
        ...formData,
        deliverables: [...formData.deliverables, deliverable],
      });
      setDeliverable('');
    }
  };

  const removeDeliverable = (idx) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== idx),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{milestone ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Milestone Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Milestone name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Milestone description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className={errors.due_date ? 'border-red-500' : ''}
              />
              {errors.due_date && <p className="text-xs text-red-500">{errors.due_date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deliverables</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add deliverable"
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDeliverable();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addDeliverable}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm"
                >
                  <span>{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeliverable(idx)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {milestone ? 'Update' : 'Create'} Milestone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
