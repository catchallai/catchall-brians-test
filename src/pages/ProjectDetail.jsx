import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2, CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TaskModal from '@/components/modals/TaskModal.jsx';
import MilestoneModal from '@/components/modals/MilestoneModal.jsx';
import DependencyManager from '@/components/projects/DependencyManager.jsx';
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
      if (!projectId) return null;
      const projects = await base44.entities.Project.list();
      return projects.find(p => p.id === projectId) || null;
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await base44.entities.ProjectTask.filter({ project_id: projectId }, '-created_date');
    },
    enabled: !!projectId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      if (!projectId) return [];
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
      if (!projectId) return [];
      return await base44.entities.TaskDependency.list();
    },
    enabled: !!projectId
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['time-logs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const allLogs = await base44.entities.TimeLog.list('-date', 200);
      return allLogs.filter(log => tasks.some(t => t.id === log.task_id));
    },
    enabled: !!projectId && tasks.length > 0
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ProjectTask.create({
        ...data,
        project_id: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setShowTaskModal(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.ProjectTask.delete(taskId),
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

  if (projectLoading) return <div className="p-6"><Skeleton className="h-96" /></div>;
  if (!project) return <div className="p-6 text-center">Project not found</div>;

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const taskStatusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user ? user.full_name : email || 'Unassigned';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Projects')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <Badge className={statusColors[project.status]} className="mt-2">
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <Link to={`${createPageUrl('Projects')}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Project
          </Button>
        </Link>
      </div>

      {/* Progress & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Progress</div>
          <div className="text-2xl font-bold">{project.progress}%</div>
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div className="bg-violet-600 h-2 rounded" style={{ width: `${project.progress}%` }} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Tasks</div>
          <div className="text-2xl font-bold">{tasks.length}</div>
          <div className="text-xs text-gray-400 mt-2">
            {taskStatusCounts.completed} completed · {taskStatusCounts.in_progress} in progress
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Milestones</div>
          <div className="text-2xl font-bold">{milestones.length}</div>
          <div className="text-xs text-gray-400 mt-2">
            {milestones.filter(m => m.status === 'completed').length} completed
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Budget</div>
          <div className="text-2xl font-bold">${(project.budget || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-2">
            ${(project.budget_spent || 0).toLocaleString()} spent
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>

          {tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No tasks yet. Create one to get started.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
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
                    <Button variant="ghost" size="sm" onClick={() => deleteTaskMutation.mutate(task.id)}>
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
          <Button onClick={() => { setEditingMilestone(null); setShowMilestoneModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            New Milestone
          </Button>

          {milestones.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No milestones yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {milestones.map(milestone => (
                <Card key={milestone.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{milestone.name}</h4>
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
                    <dt className="text-sm font-semibold text-gray-900 dark:text-white">Description</dt>
                    <dd className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</dd>
                  </div>
                </>
              )}
              {project.start_date && (
                <div>
                  <dt className="text-sm font-semibold text-gray-900 dark:text-white">Start Date</dt>
                  <dd className="text-gray-600 dark:text-gray-400">{new Date(project.start_date).toLocaleDateString()}</dd>
                </div>
              )}
              {project.end_date && (
                <div>
                  <dt className="text-sm font-semibold text-gray-900 dark:text-white">End Date</dt>
                  <dd className="text-gray-600 dark:text-gray-400">{new Date(project.end_date).toLocaleDateString()}</dd>
                </div>
              )}
              {project.team_members?.length > 0 && (
                <div>
                  <dt className="text-sm font-semibold text-gray-900 dark:text-white">Team Members</dt>
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
        onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        task={editingTask}
        onSave={(data) => createTaskMutation.mutate(data)}
        isLoading={createTaskMutation.isPending}
      />

      <MilestoneModal
        open={showMilestoneModal}
        onClose={() => { setShowMilestoneModal(false); setEditingMilestone(null); }}
        milestone={editingMilestone}
        onSave={(data) => createMilestoneMutation.mutate(data)}
        isLoading={createMilestoneMutation.isPending}
      />
    </div>
  );
}