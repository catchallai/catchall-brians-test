import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Clock,
  Play,
  Trash2,
  Plus,
  Mail,
  Users,
  Target,
  Link2,
  Archive,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

const taskTypes = {
  report_email: { icon: Mail, label: 'Email Report', color: 'bg-blue-100 text-blue-600' },
  competitor_scan: {
    icon: Users,
    label: 'Competitor Scan',
    color: 'bg-violet-100 text-violet-600',
  },
  keyword_refresh: {
    icon: Target,
    label: 'Keyword Refresh',
    color: 'bg-emerald-100 text-emerald-600',
  },
  backlink_check: { icon: Link2, label: 'Backlink Check', color: 'bg-amber-100 text-amber-600' },
  data_cleanup: { icon: Archive, label: 'Data Cleanup', color: 'bg-gray-100 text-gray-600' },
};

export default function ScheduledTasksManager() {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['scheduled-tasks'],
    queryFn: () => base44.entities.ScheduledTask.list('-created_date', 50),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['seo-reports'],
    queryFn: () => base44.entities.SEOReport.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      editingTask
        ? base44.entities.ScheduledTask.update(editingTask.id, data)
        : base44.entities.ScheduledTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
      setShowModal(false);
      setEditingTask(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (task) =>
      base44.entities.ScheduledTask.update(task.id, { is_active: !task.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }),
  });

  const runNowMutation = useMutation({
    mutationFn: async (task) => {
      // Trigger task execution
      await base44.entities.ScheduledTask.update(task.id, {
        last_run: new Date().toISOString(),
        last_result: 'Running...',
      });
      // In production, this would call a backend function
      return task;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }),
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-600" />
          Scheduled Tasks
        </CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setShowModal(true);
          }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No scheduled tasks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const typeConfig = taskTypes[task.type] || taskTypes.data_cleanup;
              const Icon = typeConfig.icon;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{task.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs capitalize">
                          {task.schedule}
                        </Badge>
                        {task.next_run && (
                          <span className="text-xs text-gray-500">
                            Next: {format(new Date(task.next_run), 'MMM d, h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.last_result && (
                      <Badge
                        className={
                          task.last_result.includes('success')
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {task.last_result.includes('success') ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : null}
                        {task.last_result.slice(0, 20)}
                      </Badge>
                    )}
                    <Switch
                      checked={task.is_active}
                      onCheckedChange={() => toggleMutation.mutate(task)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => runNowMutation.mutate(task)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => deleteMutation.mutate(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      <TaskModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        reports={reports}
        onSave={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </Card>
  );
}

function TaskModal({ open, onClose, task, reports, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    type: task?.type || 'report_email',
    schedule: task?.schedule || 'weekly',
    config: task?.config || {},
  });

  const getNextRun = (schedule) => {
    const now = new Date();
    if (schedule === 'daily') {
      return addDays(now, 1);
    }
    if (schedule === 'weekly') {
      return addWeeks(now, 1);
    }
    return addMonths(now, 1);
  };

  const handleSave = () => {
    onSave({
      ...formData,
      next_run: getNextRun(formData.schedule).toISOString(),
      is_active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Scheduled Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Task Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Weekly SEO Report"
            />
          </div>
          <div>
            <Label>Task Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(taskTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Schedule</Label>
            <Select
              value={formData.schedule}
              onValueChange={(v) => setFormData({ ...formData, schedule: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'report_email' && (
            <div>
              <Label>Report to Send</Label>
              <Select
                value={formData.config.report_id || ''}
                onValueChange={(v) =>
                  setFormData({ ...formData, config: { ...formData.config, report_id: v } })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
