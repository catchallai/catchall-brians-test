import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Briefcase, TrendingUp, Filter, X } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import ProjectModal from '@/components/modals/ProjectModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Project.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Company.filter({ business_id: user.current_business_id });
    },
    enabled: !!user?.current_business_id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id });
    },
    enabled: !!user?.current_business_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const project = await base44.entities.Project.create({
        ...data,
        business_id: user?.current_business_id,
      });
      // Log activity
      await base44.entities.Activity.create({
        business_id: user?.current_business_id,
        entity_type: 'project',
        entity_id: project.id,
        activity_type: 'created',
        title: `Created project "${data.name}"`,
        performed_by: user?.email,
        performed_by_name: user?.full_name,
      });
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      setEditingProject(null);
    },
  });

  const handleSave = (data) => {
    if (editingProject) {
      base44.entities.Project.update(editingProject.id, data);
    } else {
      createMutation.mutate(data);
    }
    queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} projects total</p>
        </div>
        <Button onClick={() => { setEditingProject(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

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

      {/* Projects Grid */}
      {isLoading ? (
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
            <Link key={project.id} to={createPageUrl('ProjectDetail', `id=${project.id}`)}>
              <Card className="p-5 glass-card hover:shadow-lg transition-all h-full cursor-pointer">
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

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingProject(project);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingProject(null); }}
        project={editingProject}
        companies={companies}
        contacts={contacts}
        onSave={handleSave}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}