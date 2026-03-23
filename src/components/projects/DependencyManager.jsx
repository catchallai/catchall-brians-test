import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DependencyManager({ taskId, allTasks = [], dependencies = [] }) {
  const [selectedTask, setSelectedTask] = useState('');
  const [depType, setDepType] = useState('finish_to_start');
  const queryClient = useQueryClient();

  const addDependencyMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.TaskDependency.create({
        task_id: taskId,
        depends_on_task_id: selectedTask,
        dependency_type: depType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies'] });
      setSelectedTask('');
    },
  });

  const removeDependencyMutation = useMutation({
    mutationFn: (depId) => base44.entities.TaskDependency.delete(depId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies'] });
    },
  });

  const taskDeps = dependencies.filter((d) => d.task_id === taskId);
  const availableTasks = allTasks.filter(
    (t) => t.id !== taskId && !taskDeps.find((d) => d.depends_on_task_id === t.id)
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Depends on task..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={depType} onValueChange={setDepType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finish_to_start">Finish-to-Start</SelectItem>
              <SelectItem value="start_to_start">Start-to-Start</SelectItem>
              <SelectItem value="finish_to_finish">Finish-to-Finish</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon"
            onClick={() => addDependencyMutation.mutate()}
            disabled={!selectedTask || addDependencyMutation.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {taskDeps.map((dep) => {
            const task = allTasks.find((t) => t.id === dep.depends_on_task_id);
            return (
              <div
                key={dep.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium">{task?.title || 'Unknown Task'}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {dep.dependency_type.replace('_', ' ')}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDependencyMutation.mutate(dep.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
