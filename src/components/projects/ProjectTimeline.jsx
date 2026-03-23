import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export default function ProjectTimeline({
  projects,
  tasks,
  milestones,
  onProjectClick,
  onTaskClick,
}) {
  const [zoomLevel, setZoomLevel] = useState(30); // pixels per day
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });

  // Calculate timeline data
  const timelineData = useMemo(() => {
    const items = [];

    // Add projects
    projects.forEach((project) => {
      if (project.start_date && project.end_date) {
        items.push({
          id: project.id,
          type: 'project',
          name: project.name,
          start: new Date(project.start_date),
          end: new Date(project.end_date),
          progress: project.progress || 0,
          status: project.status,
          priority: project.priority,
          data: project,
        });
      }
    });

    // Add tasks
    tasks.forEach((task) => {
      const project = projects.find((p) => p.id === task.project_id);
      if (task.due_date && project) {
        const start = task.created_date ? new Date(task.created_date) : new Date(task.due_date);
        const end = new Date(task.due_date);

        items.push({
          id: task.id,
          type: 'task',
          name: task.title,
          start: start,
          end: end,
          progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
          status: task.status,
          priority: task.priority,
          projectId: project.id,
          projectName: project.name,
          data: task,
        });
      }
    });

    // Add milestones
    milestones.forEach((milestone) => {
      const project = projects.find((p) => p.id === milestone.project_id);
      if (milestone.due_date && project) {
        items.push({
          id: milestone.id,
          type: 'milestone',
          name: milestone.name,
          start: new Date(milestone.due_date),
          end: new Date(milestone.due_date),
          status: milestone.status,
          projectId: project.id,
          projectName: project.name,
          data: milestone,
        });
      }
    });

    return items.sort((a, b) => a.start - b.start);
  }, [projects, tasks, milestones]);

  // Calculate visible months
  const visibleMonths = useMemo(() => {
    const months = [];
    const current = new Date(startDate);

    for (let i = 0; i < 6; i++) {
      months.push({
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: new Date(current),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [startDate]);

  const getPositionX = (date) => {
    const daysDiff = (date - startDate) / (1000 * 60 * 60 * 24);
    return daysDiff * (zoomLevel / 30) * 30;
  };

  const getWidth = (start, end) => {
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(daysDiff * (zoomLevel / 30) * 30, 20);
  };

  const statusColors = {
    planning: 'bg-blue-500',
    active: 'bg-green-500',
    in_progress: 'bg-blue-500',
    review: 'bg-purple-500',
    on_hold: 'bg-yellow-500',
    completed: 'bg-emerald-500',
    done: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    blocked: 'bg-red-500',
    todo: 'bg-gray-400',
  };

  const changeMonth = (delta) => {
    const newDate = new Date(startDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setStartDate(newDate);
  };

  const adjustZoom = (delta) => {
    setZoomLevel((prev) => Math.max(10, Math.min(60, prev + delta)));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setStartDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => adjustZoom(-5)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
            Zoom: {Math.round((zoomLevel / 30) * 100)}%
          </span>
          <Button variant="outline" size="icon" onClick={() => adjustZoom(5)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Month Headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
              {visibleMonths.map((month, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300"
                  style={{ width: `${30 * (zoomLevel / 30) * 30}px` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* Today Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-50"
              style={{ left: `${getPositionX(new Date())}px` }}
            />

            {/* Timeline Items */}
            <div className="space-y-3">
              {timelineData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No timeline data available
                </div>
              ) : (
                timelineData.map((item, idx) => (
                  <div key={idx} className="relative h-12 group">
                    {/* Item Name */}
                    <div className="absolute left-0 top-0 bottom-0 flex items-center w-48 pr-4">
                      <div className="truncate text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                        {item.projectName && item.type !== 'project' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            {item.projectName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="absolute left-48 top-0 bottom-0 flex items-center">
                      {item.type === 'milestone' ? (
                        /* Milestone Diamond */
                        <div
                          className="relative"
                          style={{ marginLeft: `${getPositionX(item.start)}px` }}
                          onClick={() =>
                            item.type === 'task'
                              ? onTaskClick(item.data)
                              : onProjectClick(item.data)
                          }
                        >
                          <div
                            className={`w-4 h-4 rotate-45 ${statusColors[item.status]} border-2 border-white dark:border-gray-800 cursor-pointer hover:scale-125 transition-transform`}
                          />
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                              {item.name}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        /* Project/Task Bar */
                        <div
                          className="relative h-8 rounded cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all"
                          style={{
                            marginLeft: `${getPositionX(item.start)}px`,
                            width: `${getWidth(item.start, item.end)}px`,
                            background: `linear-gradient(to right, ${statusColors[item.status]} 0%, ${statusColors[item.status]} ${item.progress}%, ${statusColors[item.status]}40 ${item.progress}%)`,
                          }}
                          onClick={() =>
                            item.type === 'task'
                              ? onTaskClick(item.data)
                              : onProjectClick(item.data)
                          }
                        >
                          {/* Progress Text */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-white font-semibold drop-shadow">
                              {item.progress}%
                            </span>
                          </div>

                          {/* Hover Tooltip */}
                          <div className="absolute top-10 left-0 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Card className="p-2 shadow-lg">
                              <div className="text-xs space-y-1">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-gray-500">
                                  {item.start.toLocaleDateString()} -{' '}
                                  {item.end.toLocaleDateString()}
                                </p>
                                <Badge className={statusColors[item.status]}>{item.status}</Badge>
                              </div>
                            </Card>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Active/In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>Planning/Todo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded" />
            <span>Completed/Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rotate-45 bg-purple-500 rounded" />
            <span>Milestone</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
