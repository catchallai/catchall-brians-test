import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FolderKanban,
  MessageSquare,
  GitBranch,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  Columns,
} from 'lucide-react';
import ProjectModal from '@/components/collaboration/ProjectModal';
import KanbanBoard from '@/components/collaboration/KanbanBoard';
import TableView from '@/components/collaboration/TableView';
import TimelineView from '@/components/collaboration/TimelineView';

export default function Collaboration() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // kanban, table, timeline
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['seo-projects'],
    queryFn: () => base44.entities.SEOProject.list('-created_date', 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: () => base44.entities.ProjectTask.list('-created_date', 200),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['project-comments'],
    queryFn: () => base44.entities.ProjectComment.list('-created_date', 500),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.SEOProject.create({
        ...data,
        owner: user?.email,
        team_members: [user?.email],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-projects'] });
      setShowProjectModal(false);
    },
  });

  const projectTasks = selectedProject
    ? tasks.filter((t) => t.project_id === selectedProject.id)
    : [];

  const projectComments = selectedProject
    ? comments.filter((c) => c.project_id === selectedProject.id)
    : [];

  const stats = {
    totalProjects: projects.length,
    activeTasks: tasks.filter((t) => t.status !== 'done').length,
    myTasks: tasks.filter((t) => t.assignee === user?.email && t.status !== 'done').length,
    pendingReview: tasks.filter((t) => t.status === 'review').length,
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-violet-500" />
            Team Collaboration
          </h1>
          <p className="text-gray-500 mt-1">Work together on SEO projects with AI assistance</p>
        </div>
        <Button
          onClick={() => setShowProjectModal(true)}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
                <p className="text-sm text-gray-500">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeTasks}</p>
                <p className="text-sm text-gray-500">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.myTasks}</p>
                <p className="text-sm text-gray-500">My Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1">
          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedProject?.id === project.id
                        ? 'bg-violet-100 ring-2 ring-violet-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-gray-900 truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {tasks.filter((t) => t.project_id === project.id).length} tasks
                      </span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedProject.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProject.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="gap-2"
                  >
                    <Columns className="w-4 h-4" />
                    Board
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="gap-2"
                  >
                    <List className="w-4 h-4" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === 'timeline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('timeline')}
                    className="gap-2"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Timeline
                  </Button>
                </div>
              </div>

              {viewMode === 'kanban' && (
                <KanbanBoard project={selectedProject} tasks={projectTasks} user={user} />
              )}

              {viewMode === 'table' && (
                <TableView project={selectedProject} tasks={projectTasks} user={user} />
              )}

              {viewMode === 'timeline' && (
                <TimelineView project={selectedProject} tasks={projectTasks} user={user} />
              )}
            </div>
          ) : (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-16 text-center">
                <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a project</h3>
                <p className="text-gray-500 mt-1">Choose a project to view tasks and collaborate</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSave={(data) => createProjectMutation.mutate(data)}
        isLoading={createProjectMutation.isPending}
      />
    </div>
  );
}
