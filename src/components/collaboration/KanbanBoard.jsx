import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, MoreVertical, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TaskModal from './TaskModal';

const columns = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/40' },
  { id: 'review', label: 'Review', color: 'bg-amber-100 dark:bg-amber-900/40' },
  { id: 'done', label: 'Done', color: 'bg-green-100 dark:bg-green-900/40' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function KanbanBoard({ project, tasks, user }) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
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

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (columnId) => {
    if (draggedTask && draggedTask.status !== columnId) {
      updateTaskMutation.mutate({
        id: draggedTask.id,
        data: { ...draggedTask, status: columnId },
      });
    }
    setDraggedTask(null);
  };

  const getTasksByColumn = (columnId) => {
    return tasks.filter((t) => t.status === columnId);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column.id);

          return (
            <div
              key={column.id}
              className="flex flex-col min-h-[600px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className={`${column.color} rounded-t-xl p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{column.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedTask({ status: column.id });
                    setShowTaskModal(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl p-2 space-y-2">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="cursor-move hover:shadow-lg transition-all glass-card"
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                          {task.title}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <MoreVertical className="w-3 h-3" />
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
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Badge
                          className={`text-xs ${priorityColors[task.priority] || priorityColors.medium}`}
                        >
                          {task.priority || 'medium'}
                        </Badge>

                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {task.assignee && (
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
                              {task.assignee[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {task.assignee}
                          </span>
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
