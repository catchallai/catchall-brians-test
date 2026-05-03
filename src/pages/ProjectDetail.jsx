import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ProjectKanbanBoard from '@/components/projects/ProjectKanbanBoard';
import ProjectModal from '@/components/modals/ProjectModal';
import TaskModal from '@/components/modals/TaskModal';

export default function ProjectDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => await base44.entities.Company.list(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => await base44.entities.Contact.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await base44.entities.Task.filter({ project_id: projectId }, '-created_date', 500);
    },
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Project.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setShowProjectModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.Project.delete(id);
    },
    onSuccess: () => {
      navigate('/Projects');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Task.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowTaskModal(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Task.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleSave = (data) => {
    updateMutation.mutate({ id: projectId, data });
  };

  const handleTaskSave = (data) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate({ ...data, project_id: projectId });
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const getCompanyName = (companyId) => {
    return companies.find((c) => c.id === companyId)?.name || 'N/A';
  };

  if (projectLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Trash2}
          title="Project not found"
          description="The project you're looking for doesn't exist or has been deleted."
          actionLabel="Back to Projects"
          onAction={() => navigate('/Projects')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/Projects')}
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-gray-500 mt-1">{getCompanyName(project.company_id)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowProjectModal(true)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this project?')) {
                deleteMutation.mutate(projectId);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <Card className="p-6 glass-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status</p>
            <Badge className={statusColors[project.status]}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Priority</p>
            <Badge className={priorityColors[project.priority]}>{project.priority}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Progress</p>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{project.progress}%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-violet-600 h-2 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Budget</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ${project.budget?.toLocaleString() || '0'} / ${project.budget_spent?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
        {project.description && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
            <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
          </div>
        )}
      </Card>

      {/* Tasks Kanban Board */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tasks</h2>
          <Button
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
        <ProjectKanbanBoard
          tasks={tasks}
          onTaskClick={(task) => {
            setEditingTask(task);
            setShowTaskModal(true);
          }}
          onStatusChange={(taskId, newStatus) => {
            updateTaskMutation.mutate({ id: taskId, data: { status: newStatus } });
          }}
          onAddTask={(status) => {
            setEditingTask({ status });
            setShowTaskModal(true);
          }}
        />
      </div>

      {/* Modals */}
      <ProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        project={project}
        companies={companies}
        contacts={contacts}
        onSave={handleSave}
        isLoading={updateMutation.isPending}
      />

      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleTaskSave}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
}