import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign,
  Users, Target, Calendar, ArrowRight
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProjectsDashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100)
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 1000)
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['time-logs'],
    queryFn: () => base44.entities.TimeLog.list('-date', 500)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const analytics = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on_hold').length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.budget_spent || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(1) : 0;

    const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

    // Project status breakdown
    const statusBreakdown = [
      { name: 'Active', value: activeProjects, color: '#3b82f6' },
      { name: 'Completed', value: completedProjects, color: '#10b981' },
      { name: 'On Hold', value: onHoldProjects, color: '#f59e0b' },
      { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    // Task status breakdown
    const taskStatusBreakdown = [
      { name: 'Done', value: completedTasks, color: '#10b981' },
      { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
      { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length, color: '#94a3b8' },
      { name: 'Blocked', value: blockedTasks, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Project health - projects with completion rate
    const projectHealth = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectCompleted = projectTasks.filter(t => t.status === 'done').length;
      const completionRate = projectTasks.length > 0 ? (projectCompleted / projectTasks.length * 100) : 0;
      
      return {
        name: project.name,
        completion: completionRate,
        tasks: projectTasks.length,
        status: project.status
      };
    }).sort((a, b) => b.completion - a.completion).slice(0, 10);

    // Team workload
    const teamWorkload = users.map(user => {
      const userTasks = tasks.filter(t => t.assigned_to === user.email);
      const activeTasks = userTasks.filter(t => t.status !== 'done').length;
      const completedTasks = userTasks.filter(t => t.status === 'done').length;
      
      return {
        name: user.full_name || user.email.split('@')[0],
        active: activeTasks,
        completed: completedTasks,
        total: userTasks.length
      };
    }).filter(u => u.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

    // At-risk projects (low completion rate or blocked tasks)
    const atRiskProjects = projects.filter(project => {
      if (project.status === 'completed') return false;
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectBlocked = projectTasks.filter(t => t.status === 'blocked').length;
      const projectCompleted = projectTasks.filter(t => t.status === 'done').length;
      const completionRate = projectTasks.length > 0 ? (projectCompleted / projectTasks.length * 100) : 0;
      
      return projectBlocked > 0 || (projectTasks.length > 0 && completionRate < 30);
    }).slice(0, 5);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overallCompletionRate,
      totalBudget,
      totalSpent,
      budgetUtilization,
      totalHours,
      statusBreakdown,
      taskStatusBreakdown,
      projectHealth,
      teamWorkload,
      atRiskProjects,
      blockedTasks
    };
  }, [projects, tasks, timeLogs, users]);

  const isLoading = projectsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects Overview</h1>
          <p className="text-gray-500 mt-1">Analytics and insights across all projects</p>
        </div>
        <Button asChild>
          <Link to={createPageUrl('Projects')}>
            View All Projects <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {analytics.totalProjects}
                </p>
                <p className="text-xs text-green-600 mt-1">{analytics.activeProjects} active</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Task Completion</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {analytics.overallCompletionRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.completedTasks} / {analytics.totalTasks} tasks
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budget Utilization</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {analytics.budgetUtilization}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ${(analytics.totalSpent / 1000).toFixed(0)}k / ${(analytics.totalBudget / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours Logged</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {analytics.totalHours.toFixed(0)}h
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all projects</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(analytics.atRiskProjects.length > 0 || analytics.blockedTasks > 0) && (
        <Card className="glass-card border-l-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Attention Needed</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {analytics.blockedTasks > 0 && (
                    <p>• {analytics.blockedTasks} blocked tasks need resolution</p>
                  )}
                  {analytics.atRiskProjects.length > 0 && (
                    <p>• {analytics.atRiskProjects.length} projects are at risk</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.taskStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.taskStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Project Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.projectHealth} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="completion" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.teamWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="#f59e0b" name="Active" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* At Risk Projects */}
      {analytics.atRiskProjects.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Projects Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.atRiskProjects.map(project => {
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const blockedCount = projectTasks.filter(t => t.status === 'blocked').length;
                const completedCount = projectTasks.filter(t => t.status === 'done').length;
                const completionRate = projectTasks.length > 0 ? (completedCount / projectTasks.length * 100).toFixed(0) : 0;
                
                return (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <Link 
                        to={createPageUrl('ProjectDetail') + `?id=${project.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{project.status}</Badge>
                        {blockedCount > 0 && (
                          <span className="text-xs text-red-600">{blockedCount} blocked</span>
                        )}
                        <span className="text-xs text-gray-500">{completionRate}% complete</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl('ProjectDetail') + `?id=${project.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}