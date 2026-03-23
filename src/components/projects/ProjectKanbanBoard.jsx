import { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, AlertCircle } from 'lucide-react';

const statusConfig = {
  todo: {
    label: 'To Do',
    color: 'bg-gray-100 dark:bg-gray-800',
    badgeColor: 'bg-gray-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    badgeColor: 'bg-blue-500',
  },
  review: {
    label: 'In Review',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    badgeColor: 'bg-purple-500',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-red-50 dark:bg-red-900/20',
    badgeColor: 'bg-red-500',
  },
  done: {
    label: 'Done',
    color: 'bg-green-50 dark:bg-green-900/20',
    badgeColor: 'bg-green-500',
  },
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const typeIcons = {
  task: '📋',
  bug: '🐛',
  feature: '✨',
  epic: '🎯',
  story: '📖',
};

export default function ProjectKanbanBoard({ tasks, onTaskClick, onStatusChange, onAddTask }) {
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: [],
      in_progress: [],
      review: [],
      blocked: [],
      done: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus !== oldStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) {
      return false;
    }
    return (
      new Date(dueDate) < new Date() &&
      new Date(dueDate).toDateString() !== new Date().toDateString()
    );
  };

  const isDueToday = (dueDate) => {
    if (!dueDate) {
      return false;
    }
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-300px)]">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col">
            <div className={`${config.color} rounded-t-lg p-4 border-b-4 ${config.badgeColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.badgeColor}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{config.label}</h3>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {tasksByStatus[status].length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => onAddTask(status)}
              >
                <Plus className="w-3 h-3" />
                Add Task
              </Button>
            </div>

            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-3 space-y-3 overflow-y-auto ${config.color} rounded-b-lg ${
                    snapshot.isDraggingOver ? 'ring-2 ring-violet-500 ring-inset' : ''
                  }`}
                >
                  {tasksByStatus[status].length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-500">
                      No tasks
                    </div>
                  ) : (
                    tasksByStatus[status].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-4 cursor-move hover:shadow-md transition-all ${
                              snapshot.isDragging ? 'shadow-xl rotate-2 ring-2 ring-violet-500' : ''
                            } ${status === 'blocked' ? 'border-red-300 dark:border-red-700' : ''}`}
                            onClick={() => onTaskClick(task)}
                          >
                            {/* Task Type Icon */}
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-lg">
                                {typeIcons[task.task_type] || typeIcons.task}
                              </span>
                              {task.priority && (
                                <Badge className={`${priorityColors[task.priority]} text-xs`}>
                                  {task.priority}
                                </Badge>
                              )}
                            </div>

                            {/* Task Title */}
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Task Description */}
                            {task.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Task Meta */}
                            <div className="space-y-2">
                              {/* Due Date */}
                              {task.due_date && (
                                <div
                                  className={`flex items-center gap-1 text-xs ${
                                    isOverdue(task.due_date)
                                      ? 'text-red-600 dark:text-red-400 font-semibold'
                                      : isDueToday(task.due_date)
                                        ? 'text-orange-600 dark:text-orange-400 font-semibold'
                                        : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {isOverdue(task.due_date) ? (
                                    <AlertCircle className="w-3 h-3" />
                                  ) : (
                                    <Calendar className="w-3 h-3" />
                                  )}
                                  {new Date(task.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                  {isOverdue(task.due_date) && ' (Overdue)'}
                                  {isDueToday(task.due_date) && ' (Today)'}
                                </div>
                              )}

                              {/* Estimated Hours */}
                              {task.estimated_hours && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {task.estimated_hours}h
                                  {task.actual_hours && ` / ${task.actual_hours}h`}
                                </div>
                              )}

                              {/* Tags */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.slice(0, 3).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{task.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Assignee */}
                              {task.assigned_to && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                                      {task.assigned_to[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                    {task.assigned_to.split('@')[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
