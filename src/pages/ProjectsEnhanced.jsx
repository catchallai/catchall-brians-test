import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export default function ProjectsEnhanced() {
  const [selectedProject, setSelectedProject] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', selectedProject?.id],
    queryFn: () =>
      selectedProject ? base44.entities.Task.filter({ project_id: selectedProject.id }) : [],
    enabled: !!selectedProject,
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', selectedProject?.id],
    queryFn: () =>
      selectedProject ? base44.entities.Sprint.filter({ project_id: selectedProject.id }) : [],
    enabled: !!selectedProject,
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['time-logs'],
    queryFn: () => base44.entities.TimeLog.list('-date', 100),
  });

  const { data: epics = [] } = useQuery({
    queryKey: ['epics', selectedProject?.id],
    queryFn: () =>
      selectedProject ? base44.entities.Epic.filter({ project_id: selectedProject.id }) : [],
    enabled: !!selectedProject,
  });

  if (!selectedProject) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-gray-500 mt-1">Manage projects, sprints, and team workload</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="glass-card cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {project.description}
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline">{project.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeSprint = sprints.find((s) => s.status === 'active');
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

  // Calculate metrics
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completionRate = tasks.length > 0 ? ((completedTasks / tasks.length) * 100).toFixed(0) : 0;

  const totalBudget = selectedProject.budget || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedProject.name}
              </h1>
              <p className="text-sm text-gray-500">{selectedProject.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Share
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Project Budget
                  </p>
                  <p className="text-2xl font-bold">${(totalBudget / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-400">/ month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Forecast 2025</p>
                <p className="text-2xl font-bold">${((totalBudget * 12) / 1000000).toFixed(1)}m</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-center">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionRate / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
                      <p className="text-xs text-gray-400">
                        {completedTasks} of {tasks.length}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Goal completion</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time Logged</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(0)}h</p>
                <p className="text-xs text-gray-400">Total hours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Board Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Board Summary */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-blue-600">📊</span> Board Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <Badge className="bg-green-100 text-green-800">On Track</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Working on</span>
                      <span className="font-medium">{inProgressTasks} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Stuck</span>
                      <span className="font-medium">0 tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Done</span>
                      <span className="font-medium">{completedTasks} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Epics Progress */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-purple-600">🎯</span> Epic Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {epics.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No epics yet</p>
                ) : (
                  epics.map((epic) => {
                    const epicTasks = tasks.filter((t) => t.epic_id === epic.id);
                    const epicCompleted = epicTasks.filter((t) => t.status === 'done').length;
                    const epicProgress =
                      epicTasks.length > 0
                        ? ((epicCompleted / epicTasks.length) * 100).toFixed(0)
                        : 0;

                    return (
                      <div key={epic.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{epic.name}</h4>
                            <p className="text-xs text-gray-500">{epicTasks.length} tasks</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-600">{epicProgress}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${epicProgress}%` }}
                          />
                        </div>
                        {epic.target_date && (
                          <p className="text-xs text-gray-400 mt-2">
                            Due: {new Date(epic.target_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Sprints */}
            {activeSprint && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-orange-600">⚡</span> Active Sprint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{activeSprint.name}</h4>
                        <p className="text-xs text-gray-500">{activeSprint.goal}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{activeSprint.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Start</p>
                        <p className="font-medium">
                          {new Date(activeSprint.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">End</p>
                        <p className="font-medium">
                          {new Date(activeSprint.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tasks & Team */}
          <div className="space-y-6">
            {/* Pending Tasks */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-red-600">⚠️</span> Pending Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status !== 'done')
                    .slice(0, 5)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                            {task.assigned_to && (
                              <span className="text-xs text-gray-500">
                                {task.assigned_to.split('@')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-yellow-600">🏆</span> Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    tasks.reduce((acc, task) => {
                      if (task.assigned_to && task.status === 'done') {
                        acc[task.assigned_to] = (acc[task.assigned_to] || 0) + 1;
                      }
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([email, count], idx) => (
                      <div key={email} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{email.split('@')[0]}</p>
                          <p className="text-xs text-gray-500">{count} tasks completed</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
