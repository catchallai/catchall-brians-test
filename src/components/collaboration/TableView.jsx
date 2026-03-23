import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, MoreVertical, Calendar, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TaskModal from './TaskModal';

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
};

export default function TableView({ project, tasks, user }) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ProjectTask.create({
        ...data,
        project_id: project.id,
        created_by: user?.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setShowTaskModal(false);
      setSelectedTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setShowTaskModal(false);
      setSelectedTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    },
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (!aVal) {
      return 1;
    }
    if (!bVal) {
      return -1;
    }
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Tasks</h3>
        <Button onClick={() => setShowTaskModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  Task
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                <div className="flex items-center gap-1">
                  Priority
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('due_date')}>
                <div className="flex items-center gap-1">
                  Due Date
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No tasks yet. Click "Add Task" to create one.
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <TableCell>
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={(checked) => {
                        updateTaskMutation.mutate({
                          id: task.id,
                          data: { ...task, status: checked ? 'done' : 'todo' },
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[task.status] || statusColors.todo} text-xs`}>
                      {task.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${priorityColors[task.priority] || priorityColors.medium} text-xs`}
                    >
                      {task.priority || 'medium'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium">
                          {task.assignee[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm truncate max-w-[120px]">{task.assignee}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={(data) => {
          if (selectedTask?.id) {
            updateTaskMutation.mutate({ id: selectedTask.id, data });
          } else {
            createTaskMutation.mutate(data);
          }
        }}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
}
