import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, List, CalendarDays, Users, Zap } from "lucide-react";

import SprintBoard from '@/components/projects/SprintBoard';
import GanttChart from '@/components/projects/GanttChart';
import TimeTracker from '@/components/projects/TimeTracker';
import WorkloadView from '@/components/projects/WorkloadView';
import KanbanBoard from '@/components/collaboration/KanbanBoard';
import TaskList from '@/components/collaboration/TaskList';

export default function ProjectsEnhanced() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('board');
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', selectedProject?.id],
    queryFn: () => selectedProject
      ? base44.entities.Task.filter({ project_id: selectedProject.id })
      : [],
    enabled: !!selectedProject
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', selectedProject?.id],
    queryFn: () => selectedProject
      ? base44.entities.Sprint.filter({ project_id: selectedProject.id })
      : [],
    enabled: !!selectedProject
  });

  const { data: workloads = [] } = useQuery({
    queryKey: ['workloads'],
    queryFn: () => base44.entities.Workload.list('-week_start', 20)
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['time-logs'],
    queryFn: () => base44.entities.TimeLog.list('-date', 100)
  });

  const createSprintMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      return base44.entities.Sprint.create({
        project_id: selectedProject.id,
        name: `Sprint ${sprints.length + 1}`,
        goal: 'Deliver key features and improvements',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        capacity: 80
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    }
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
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

  const activeSprint = sprints.find(s => s.status === 'active');
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setSelectedProject(null)}>← Back</Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedProject.name}</h1>
            <p className="text-gray-500">{selectedProject.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode('board')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode('timeline')}>
            <CalendarDays className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Tasks</p>
            <p className="text-3xl font-bold">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active Sprint</p>
            <p className="text-lg font-bold">{activeSprint?.name || 'None'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Time Logged</p>
            <p className="text-3xl font-bold">{totalHours.toFixed(0)}h</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Team Load</p>
            <p className="text-3xl font-bold">{workloads.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {viewMode === 'board' ? (
            <KanbanBoard tasks={tasks} projectId={selectedProject.id} />
          ) : viewMode === 'list' ? (
            <TaskList tasks={tasks} projectId={selectedProject.id} />
          ) : (
            <GanttChart tasks={tasks} />
          )}
        </TabsContent>

        <TabsContent value="sprints" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sprint Planning</h3>
            <Button
              onClick={() => createSprintMutation.mutate()}
              disabled={createSprintMutation.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> New Sprint
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sprints.map((sprint) => (
              <SprintBoard key={sprint.id} sprint={sprint} tasks={tasks} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <GanttChart tasks={tasks} />
        </TabsContent>

        <TabsContent value="workload">
          <WorkloadView workloads={workloads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}