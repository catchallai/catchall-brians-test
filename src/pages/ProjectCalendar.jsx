import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Download, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, list
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: () => base44.entities.ProjectTask.list('-due_date', 500),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones'],
    queryFn: () => base44.entities.ProjectMilestone.list('-due_date', 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  // Get unique assignees
  const assignees = useMemo(() => {
    const emails = [...new Set(tasks.map((t) => t.assigned_to).filter(Boolean))];
    return emails.map((email) => {
      const contact = contacts.find((c) => c.email === email);
      return {
        email,
        name: contact ? `${contact.first_name} ${contact.last_name}` : email,
      };
    });
  }, [tasks, contacts]);

  // Calendar events
  const events = useMemo(() => {
    const allEvents = [];

    // Add project start/end dates
    projects.forEach((project) => {
      if (selectedProject !== 'all' && project.id !== selectedProject) {
        return;
      }

      if (project.start_date) {
        allEvents.push({
          id: `project-start-${project.id}`,
          type: 'project-start',
          date: new Date(project.start_date),
          title: `${project.name} (Start)`,
          project: project.name,
          projectId: project.id,
          status: project.status,
          priority: project.priority,
        });
      }
      if (project.end_date) {
        allEvents.push({
          id: `project-end-${project.id}`,
          type: 'project-end',
          date: new Date(project.end_date),
          title: `${project.name} (Due)`,
          project: project.name,
          projectId: project.id,
          status: project.status,
          priority: project.priority,
        });
      }
    });

    // Add task due dates
    tasks.forEach((task) => {
      const project = projects.find((p) => p.id === task.project_id);
      if (selectedProject !== 'all' && task.project_id !== selectedProject) {
        return;
      }
      if (selectedAssignee !== 'all' && task.assigned_to !== selectedAssignee) {
        return;
      }

      if (task.due_date) {
        allEvents.push({
          id: `task-${task.id}`,
          type: 'task',
          date: new Date(task.due_date),
          title: task.title,
          project: project?.name || 'Unknown',
          projectId: task.project_id,
          assignee: task.assigned_to,
          status: task.status,
          priority: task.priority,
        });
      }
    });

    // Add milestones
    milestones.forEach((milestone) => {
      const project = projects.find((p) => p.id === milestone.project_id);
      if (selectedProject !== 'all' && milestone.project_id !== selectedProject) {
        return;
      }

      if (milestone.due_date) {
        allEvents.push({
          id: `milestone-${milestone.id}`,
          type: 'milestone',
          date: new Date(milestone.due_date),
          title: milestone.name,
          project: project?.name || 'Unknown',
          projectId: milestone.project_id,
          status: milestone.status,
        });
      }
    });

    return allEvents.sort((a, b) => a.date - b.date);
  }, [projects, tasks, milestones, selectedProject, selectedAssignee]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(
        (event) => event.date.toDateString() === current.toDateString()
      );

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        events: dayEvents,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, events]);

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const exportToCalendar = () => {
    // Generate ICS file
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Project Management//EN\n';

    events.forEach((event) => {
      const dateStr = event.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `UID:${event.id}\n`;
      icsContent += `DTSTAMP:${dateStr}\n`;
      icsContent += `DTSTART:${dateStr}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:${event.type} - ${event.project}\n`;
      icsContent += `END:VEVENT\n`;
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-calendar.ics';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const typeColors = {
    'project-start': 'bg-blue-100 text-blue-800 border-blue-300',
    'project-end': 'bg-purple-100 text-purple-800 border-purple-300',
    task: 'bg-green-100 text-green-800 border-green-300',
    milestone: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  const typeIcons = {
    'project-start': '▶',
    'project-end': '🎯',
    task: '✓',
    milestone: '⭐',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Calendar</h1>
          <p className="text-gray-500 mt-1">View all projects, tasks, and milestones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCalendar} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link to={createPageUrl('Projects')}>
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Month
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {assignees.map((assignee) => (
                <SelectItem key={assignee.email} value={assignee.email}>
                  {assignee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
            <span>Project Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300" />
            <span>Project Due</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
            <span>Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
            <span>Milestone</span>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {viewMode === 'month' ? (
        <Card className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                  day.isCurrentMonth
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                } ${day.isToday ? 'ring-2 ring-violet-500' : ''}`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    day.isToday
                      ? 'text-violet-600 dark:text-violet-400'
                      : day.isCurrentMonth
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400'
                  }`}
                >
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      to={createPageUrl('ProjectDetail', `id=${event.projectId}`)}
                      className={`block text-xs p-1 rounded border truncate ${typeColors[event.type]} hover:opacity-80`}
                      title={event.title}
                    >
                      {typeIcons[event.type]} {event.title}
                    </Link>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* List View */
        <Card className="p-4">
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No events scheduled</p>
            ) : (
              events.map((event) => (
                <Link
                  key={event.id}
                  to={createPageUrl('ProjectDetail', `id=${event.projectId}`)}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${typeColors[event.type]}`}
                    >
                      {typeIcons[event.type]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{event.project}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.type.replace('-', ' ')}
                    </p>
                  </div>
                  {event.assignee && (
                    <Badge variant="outline" className="flex-shrink-0">
                      {event.assignee.split('@')[0]}
                    </Badge>
                  )}
                </Link>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
