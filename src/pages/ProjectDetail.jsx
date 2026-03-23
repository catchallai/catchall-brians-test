import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TaskModal from '@/components/modals/TaskModal.jsx';
import MilestoneModal from '@/components/modals/MilestoneModal.jsx';
import ActivityLog from '@/components/projects/ActivityLog.jsx';
import ResourcePlanner from '@/components/projects/ResourcePlanner.jsx';
import TimeTracker from '@/components/projects/TimeTracker.jsx';

export default function ProjectDetail() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) {
        return null;
      }
      const projects = await base44.entities.Project.list();
      return projects.find((p) => p.id === projectId) || null;
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) {
        return [];
      }
      return await base44.entities.Task.filter({ project_id: projectId }, '-created_date');
    },
    enabled: !!projectId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      if (!projectId) {
        return [];
      }
      return await base44.entities.ProjectMilestone.filter({ project_id: projectId }, 'due_date');
    },
    enabled: !!projectId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: dependencies = [] } = useQuery({
    queryKey: ['task-dependencies', projectId],
    queryFn: async () => {
      if (!projectId) {
        return [];
      }
      return await base44.entities.TaskDependency.list();
    },
    enabled: !!projectId,
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['time-logs', projectId],
    queryFn: async () => {
      if (!projectId) {
        return [];
      }
      const allLogs = await base44.entities.TimeLog.list('-date', 200);
      return allLogs.filter((log) => tasks.some((t) => t.id === log.task_id));
    },
    enabled: !!projectId && tasks.length > 0,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      const task = await base44.entities.Task.create({
        ...data,
        project_id: projectId,
      });

      // Send notification if task is assigned
      if (task.assigned_to) {
        try {
          await base44.functions.invoke('notifyAssignment', {
            task_id: task.id,
            entity_type: 'task',
            assigned_to: task.assigned_to,
            assigned_by: user.email,
            title: task.title,
            due_date: task.due_date,
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setShowTaskModal(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ProjectMilestone.create({
        ...data,
        project_id: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
      setShowMilestoneModal(false);
      setEditingMilestone(null);
    },
  });

  if (projectLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!project) {
    return <div className="p-6 text-center">Project not found</div>;
  }

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const taskStatusCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const getUserName = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? user.full_name : email || 'Unassigned';
  };

  const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const completionRate =
    tasks.length > 0 ? ((taskStatusCounts.completed / tasks.length) * 100).toFixed(0) : 0;
  const budgetPercentage =
    project.budget > 0 ? (((project.budget_spent || 0) / project.budget) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Projects')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Share
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Project Budget</p>
              <p className="text-2xl font-bold">${((project.budget || 0) / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-400">/ total</p>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spent</p>
              <p className="text-2xl font-bold">
                ${((project.budget_spent || 0) / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-gray-400">{budgetPercentage}% used</p>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm p-4 flex items-center justify-center">
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
                      {taskStatusCounts.completed} of {tasks.length}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Goal completion</p>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time Logged</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(0)}h</p>
              <p className="text-xs text-gray-400">Total hours</p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Board Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Board Summary */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-blue-600">📊</span> Board Summary
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <Badge className={statusColors[project.status]}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Working on</span>
                      <span className="font-medium">{taskStatusCounts.in_progress} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width:
                            tasks.length > 0
                              ? `${(taskStatusCounts.in_progress / tasks.length) * 100}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>To Do</span>
                      <span className="font-medium">{taskStatusCounts.todo} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{
                          width:
                            tasks.length > 0
                              ? `${(taskStatusCounts.todo / tasks.length) * 100}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Done</span>
                      <span className="font-medium">{taskStatusCounts.completed} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Milestones Progress */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-purple-600">🎯</span> Milestones
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingMilestone(null);
                    setShowMilestoneModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="p-4 space-y-4">
                {milestones.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No milestones yet</p>
                ) : (
                  milestones.map((milestone) => (
                    <div key={milestone.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {milestone.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <h4 className="font-semibold text-sm">{milestone.name}</h4>
                            <p className="text-xs text-gray-500">
                              Due: {new Date(milestone.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{milestone.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Tasks List */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-orange-600">✓</span> All Tasks
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                          {task.assigned_to && (
                            <span className="text-xs text-gray-500">
                              {getUserName(task.assigned_to)}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-gray-400">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Team & Details */}
          <div className="space-y-6">
            {/* Team Leaderboard */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-yellow-600">🏆</span> Leaderboard
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(
                  tasks.reduce((acc, task) => {
                    if (task.assigned_to && task.status === 'completed') {
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
                        <p className="text-sm font-medium">{getUserName(email)}</p>
                        <p className="text-xs text-gray-500">{count} tasks completed</p>
                      </div>
                    </div>
                  ))}
                {tasks.filter((t) => t.status === 'completed').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No completed tasks yet</p>
                )}
              </div>
            </Card>

            {/* Project Details */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-indigo-600">ℹ️</span> Project Details
                </h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {project.start_date && (
                  <div>
                    <p className="text-gray-500 text-xs">Start Date</p>
                    <p className="font-medium">
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <p className="text-gray-500 text-xs">End Date</p>
                    <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                {project.team_members?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs">Team Members</p>
                    <p className="font-medium">{project.team_members.join(', ')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Legacy Tabs (hidden but keeping for compatibility) */}
      <Tabs defaultValue="tasks" className="w-full hidden">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Button
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>

          {tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No tasks yet. Create one to get started.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                      <p className="text-sm text-gray-500">{getUserName(task.assigned_to)}</p>
                      {task.due_date && (
                        <p className="text-xs text-gray-400 mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4 mt-4">
          <Button
            onClick={() => {
              setEditingMilestone(null);
              setShowMilestoneModal(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Milestone
          </Button>

          {milestones.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No milestones yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {milestone.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{milestone.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResourcePlanner tasks={tasks} timeLogs={timeLogs} />
            <TimeTracker taskId={tasks[0]?.id} timeLogs={timeLogs} />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <ActivityLog projectId={projectId} />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <Card className="p-6">
            <dl className="space-y-4">
              {project.description && (
                <>
                  <div>
                    <dt className="text-sm font-semibold text-gray-900 dark:text-white">
                      Description
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</dd>
                  </div>
                </>
              )}
              {project.start_date && (
                <div>
                  <dt className="text-sm font-semibold text-gray-900 dark:text-white">
                    Start Date
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    {new Date(project.start_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {project.end_date && (
                <div>
                  <dt className="text-sm font-semibold text-gray-900 dark:text-white">End Date</dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    {new Date(project.end_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {project.team_members?.length > 0 && (
                <div>
                  <dt className="text-sm font-semibold text-gray-900 dark:text-white">
                    Team Members
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400 mt-1">
                    {project.team_members.join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={(data) => createTaskMutation.mutate(data)}
        isLoading={createTaskMutation.isPending}
      />

      <MilestoneModal
        open={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
          setEditingMilestone(null);
        }}
        milestone={editingMilestone}
        onSave={(data) => createMilestoneMutation.mutate(data)}
        isLoading={createMilestoneMutation.isPending}
      />
    </div>
  );
}
