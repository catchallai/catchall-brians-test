import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Briefcase, Filter, X, Calendar, DollarSign, Users, LayoutGrid, List } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import ProjectModal from '@/components/modals/ProjectModal';
import TaskModal from '@/components/modals/TaskModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'grid'
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      return await base44.entities.Project.list('-created_date', 200);
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      return await base44.entities.Company.list();
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      return await base44.entities.Contact.list();
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      return await base44.entities.Task.list('-created_date', 500);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Project.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      setEditingProject(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Project.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      setEditingProject(null);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Task.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      setShowTaskModal(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Task.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });

  const handleSave = (data) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTaskSave = (data) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate({ ...data, project_id: selectedProject?.id });
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const taskId = draggableId;
    const newStatus = destination.droppableId;

    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !searchTerm || project.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter]);

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
    return companies.find(c => c.id === companyId)?.name || 'N/A';
  };

  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'N/A';
  };

  // Get backlog tasks (no project assigned)
  const backlogTasks = tasks.filter(t => !t.project_id);
  const projectTasks = selectedProject ? tasks.filter(t => t.project_id === selectedProject.id) : [];
  
  const tasksByStatus = {
    backlog: backlogTasks,
    todo: projectTasks.filter(t => t.status === 'todo'),
    in_progress: projectTasks.filter(t => t.status === 'in_progress'),
    review: projectTasks.filter(t => t.status === 'review'),
    done: projectTasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Management</h1>
          <p className="text-gray-500 mt-1">Manage and track all your projects</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => { setEditingProject(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{projects.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-violet-600" />
            </div>
          </Card>
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filter Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        /* Projects Grid */
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No projects yet"
            description="Start creating projects to organize your work."
            actionLabel="New Project"
            onAction={() => { setEditingProject(null); setShowModal(true); }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="p-5 glass-card hover:shadow-lg transition-all h-full cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{getCompanyName(project.company_id)}</p>
                  </div>
                  <Badge className={statusColors[project.status]}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <Badge className={priorityColors[project.priority]}>
                    {project.priority}
                  </Badge>
                  {project.team_members?.length > 0 && (
                    <Badge variant="outline">{project.team_members.length} members</Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {project.end_date && (
                  <p className="text-xs text-gray-500">
                    Due: {new Date(project.end_date).toLocaleDateString()}
                  </p>
                )}

                {project.budget && (
                  <p className="text-xs text-gray-500 mt-1">
                    Budget: ${project.budget.toLocaleString()} / Spent: ${project.budget_spent.toLocaleString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Board View */
        <div>
          {/* Project Selector */}
          <div className="mb-4">
            <Select value={selectedProject?.id || ''} onValueChange={(id) => setSelectedProject(projects.find(p => p.id === id))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProject && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">{projectTasks.length} tasks</p>
              </div>
              <Button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
          )}

          {/* Board */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Backlog Column */}
              <div className="flex-shrink-0 w-80">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Backlog</h3>
                    <Badge variant="secondary">{tasksByStatus.backlog.length}</Badge>
                  </div>
                  <Droppable droppableId="backlog">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-32 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        {tasksByStatus.backlog.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 cursor-move ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                              >
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                                {task.priority && (
                                  <Badge className={`${priorityColors[task.priority]} text-xs mt-2`}>
                                    {task.priority}
                                  </Badge>
                                )}
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Task Status Columns */}
              {selectedProject && ['todo', 'in_progress', 'review', 'done'].map(status => (
                <div key={status} className="flex-shrink-0 w-80">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {status.replace('_', ' ')}
                      </h3>
                      <Badge variant="secondary">{tasksByStatus[status].length}</Badge>
                    </div>
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-32 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          {tasksByStatus[status].map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 cursor-move ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                  onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                                >
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {task.priority && (
                                      <Badge className={`${priorityColors[task.priority]} text-xs`}>
                                        {task.priority}
                                      </Badge>
                                    )}
                                    {task.assigned_to && (
                                      <Badge variant="outline" className="text-xs">
                                        {task.assigned_to.split('@')[0]}
                                      </Badge>
                                    )}
                                  </div>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingProject(null); }}
        project={editingProject}
        companies={companies}
        contacts={contacts}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <TaskModal
        open={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        task={editingTask}
        onSave={handleTaskSave}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
}