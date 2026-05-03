import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Edit2,
} from 'lucide-react';
import ProjectKanbanBoard from '@/components/projects/ProjectKanbanBoard';
import ProjectFoldersList from '@/components/collaboration/ProjectFoldersList';
import ProjectModal from '@/components/modals/ProjectModal';
import TaskModal from '@/components/modals/TaskModal';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await base44.entities.Project.list().then(
        (projects) => projects.find((p) => p.id === projectId)
      );
    },
    enabled: !!projectId,
  });

  // Fetch company
  const { data: company } = useQuery({
    queryKey: ['company', project?.company_id],
    queryFn: async () => {
      if (!project?.company_id) return null;
      const companies = await base44.entities.Company.list();
      return companies.find((c) => c.id === project.company_id);
    },
    enabled: !!project?.company_id,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await base44.entities.Task.list().then((allTasks) =>
        allTasks.filter((t) => t.project_id === projectId)
      );
    },
    enabled: !!projectId,
  });

  // Fetch companies and contacts for modal
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => await base44.entities.Company.list(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => await base44.entities.Contact.list(),
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async (params) => {
      return await base44.entities.Project.update(params.id, params.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setShowProjectModal(false);
    },
  });

  // Create/update task mutation
  const taskMutation = useMutation({
    mutationFn: async (taskData) => {
      if (editingTask?.id) {
        return await base44.entities.Task.update(editingTask.id, taskData);
      }
      return await base44.entities.Task.create({
        ...taskData,
        project_id: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setShowTaskModal(false);
      setEditingTask(null);
    },
  });

  if (projectLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Button onClick={() => navigate('/Projects')} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>
        <div className="mt-8 text-center text-gray-500">Project not found</div>
      </div>
    );
  }

  const statusColors: any = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const priorityColors: any = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => navigate('/Projects')}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={() => setShowProjectModal(true)}
          className="gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Project
        </Button>
      </div>

      {/* Project Info */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {project.name}
        </h1>
        <p className="text-gray-500 mt-2">{company?.name || 'No company'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <Badge className={statusColors[project.status]}>
              {project.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm font-medium">Status</span>
          </div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <Badge className={priorityColors[project.priority]}>
              {project.priority}
            </Badge>
            <span className="text-sm font-medium">Priority</span>
          </div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.progress}%
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-sm font-medium">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : 'No date'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Info */}
      {project.budget && (
        <Card className="p-4 glass-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-lg font-semibold">
                  ${project.budget.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-lg font-semibold">
                ${(project.budget_spent || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Team Members */}
      {project.team_members?.length > 0 && (
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold">Team Members</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.team_members.map((member: any) => (
              <Badge key={member.id || member.email} variant="outline">
                {member.name || member.email}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Project Folders */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Project Folders
        </h2>
        <ProjectFoldersList projectId={projectId} />
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Tasks ({tasks.length})
          </h2>
          <Button onClick={() => setShowTaskModal(true)} className="gap-2">
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
            taskMutation.mutate({ status: newStatus });
          }}
          onAddTask={() => {
            setEditingTask(null);
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
        onSave={(data) => updateMutation.mutate({ id: project.id, data })}
        isLoading={updateMutation.isPending}
      />

      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={(data) => taskMutation.mutate(data)}
        isLoading={taskMutation.isPending}
      />
    </div>
  );
}