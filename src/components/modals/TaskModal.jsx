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
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function TaskModal({ open, onClose, task, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    actual_hours: '',
    progress: 0,
  });
  const [errors, setErrors] = useState({});

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours || '',
        actual_hours: task.actual_hours || '',
        progress: task.progress || 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        estimated_hours: '',
        actual_hours: '',
        progress: 0,
      });
    }
  }, [task, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setErrors({ title: 'Task title is required' });
      return;
    }
    if (!formData.assigned_to) {
      setErrors({ assigned_to: 'Assignee is required' });
      return;
    }
    setErrors({});

    // Call onSave and get the result
    const result = await onSave(formData);

    // If this is a new assignment (no existing task or assignee changed), notify the user
    if ((!task || task.assigned_to !== formData.assigned_to) && result?.id) {
      try {
        const currentUser = await base44.auth.me();
        await base44.functions.invoke('notifyAssignment', {
          task_id: result.id,
          entity_type: 'task',
          assigned_to: formData.assigned_to,
          assigned_by: currentUser.email,
          title: formData.title,
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To *</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Est. Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || '' })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_hours">Actual Hours</Label>
              <Input
                id="actual_hours"
                type="number"
                step="0.5"
                value={formData.actual_hours}
                onChange={(e) =>
                  setFormData({ ...formData, actual_hours: parseFloat(e.target.value) || '' })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">Progress (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) =>
                setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
