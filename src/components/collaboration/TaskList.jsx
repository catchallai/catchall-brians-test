import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const statusConfig = {
  todo: { icon: Clock, color: 'bg-gray-100 text-gray-700', label: 'To Do' },
  in_progress: { icon: AlertTriangle, color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  review: { icon: User, color: 'bg-amber-100 text-amber-700', label: 'Review' },
  done: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Done' },
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function TaskList({ project, tasks, user }) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    category: 'other',
    due_date: '',
  });
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ProjectTask.create({
        ...data,
        project_id: project.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setShowAddTask(false);
      setNewTask({
        title: '',
        description: '',
        assignee: '',
        priority: 'medium',
        category: 'other',
        due_date: '',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
  });

  const filteredTasks =
    filter === 'all'
      ? tasks
      : filter === 'mine'
        ? tasks.filter((t) => t.assignee === user?.email)
        : tasks.filter((t) => t.status === filter);

  const groupedTasks = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    review: filteredTasks.filter((t) => t.status === 'review'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="mine">My Tasks</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setShowAddTask(true)}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(groupedTasks).map(([status, statusTasks]) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">{config.label}</span>
                <Badge variant="outline" className="ml-auto">
                  {statusTasks.length}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {statusTasks.map((task) => (
                  <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                updateTaskMutation.mutate({ id: task.id, data: { status: 'todo' } })
                              }
                            >
                              Move to To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateTaskMutation.mutate({
                                  id: task.id,
                                  data: { status: 'in_progress' },
                                })
                              }
                            >
                              Move to In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateTaskMutation.mutate({
                                  id: task.id,
                                  data: { status: 'review' },
                                })
                              }
                            >
                              Move to Review
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateTaskMutation.mutate({ id: task.id, data: { status: 'done' } })
                              }
                            >
                              Mark Done
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={`${priorityColors[task.priority]} text-xs`}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                      </div>
                      {task.assignee && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs bg-violet-100 text-violet-600">
                              {task.assignee[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500 truncate">{task.assignee}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assignee</Label>
                <Input
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(v) => setNewTask({ ...newTask, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seo_audit">SEO Audit</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="keywords">Keywords</SelectItem>
                    <SelectItem value="backlinks">Backlinks</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddTask(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createTaskMutation.mutate(newTask)}
                disabled={!newTask.title || createTaskMutation.isPending}
              >
                {createTaskMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
