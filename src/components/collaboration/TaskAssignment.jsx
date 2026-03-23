import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function TaskAssignment({ entityType, entityId }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', entityType, entityId],
    queryFn: async () => {
      if (!entityId) {
        return [];
      }
      return await base44.entities.Task.filter(
        {
          entity_type: entityType,
          entity_id: entityId,
        },
        '-due_date'
      );
    },
    enabled: !!entityId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['team-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Task.create({
        ...data,
        entity_type: entityType,
        entity_id: entityId,
        business_id: user?.current_business_id,
        assigned_by: user?.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', entityType, entityId] });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.Task.update(id, {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', entityType, entityId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', entityType, entityId] });
    },
  });

  const handleSaveTask = () => {
    if (!formData.title.trim() || !formData.assigned_to) {
      return;
    }
    createTaskMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      default:
        return 'text-emerald-600';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) {
      return false;
    }
    return new Date(dueDate) < new Date();
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tasks</CardTitle>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No tasks assigned</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${
                task.status === 'completed'
                  ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
                {task.due_date && (
                  <Badge
                    variant="outline"
                    className={isOverdue(task.due_date) ? 'bg-red-100 text-red-800' : ''}
                  >
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    {new Date(task.due_date).toLocaleDateString()}
                  </Badge>
                )}
                <span className="text-gray-500 ml-auto">→ {task.assigned_to.split('@')[0]}</span>
              </div>

              {task.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'completed' })}
                  className="mt-2 w-full text-xs gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Mark Complete
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Follow up on proposal"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional details"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Assign To *</label>
              <Select
                value={formData.assigned_to}
                onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={!formData.title.trim() || !formData.assigned_to}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
