import { useMemo, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  ArrowRight,
  Sparkles,
  Brain,
  Lightbulb,
} from 'lucide-react';

// Calculate Project Health Score (0-100)
const calculateHealthScore = (project, tasks) => {
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  if (projectTasks.length === 0) {
    return 50;
  }

  let score = 100;

  // Completion rate (40 points)
  const completedTasks = projectTasks.filter((t) => t.status === 'done').length;
  const completionRate = completedTasks / projectTasks.length;
  score = completionRate * 40;

  // Blocked tasks penalty (20 points)
  const blockedTasks = projectTasks.filter((t) => t.status === 'blocked').length;
  const blockedPenalty = (blockedTasks / projectTasks.length) * 20;
  score += 20 - blockedPenalty;

  // Budget health (20 points)
  if (project.budget && project.budget > 0) {
    const budgetUtilization = (project.budget_spent || 0) / project.budget;
    if (budgetUtilization <= 0.9) {
      score += 20;
    } else if (budgetUtilization <= 1.0) {
      score += 10;
    }
  } else {
    score += 15; // neutral if no budget
  }

  // Timeline health (20 points)
  if (project.end_date) {
    const daysToEnd = (new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysToEnd > 30) {
      score += 20;
    } else if (daysToEnd > 0) {
      score += 10;
    } else if (daysToEnd < 0 && completionRate < 1) {
      score -= 10; // overdue penalty
    }
  } else {
    score += 15; // neutral if no end date
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const getHealthColor = (score) => {
  if (score >= 80) {
    return { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-500' };
  }
  if (score >= 60) {
    return { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-500' };
  }
  if (score >= 40) {
    return { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-500' };
  }
  return { bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-500' };
};

export default function ProjectsDashboard() {
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 1000),
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['time-logs'],
    queryFn: () => base44.entities.TimeLog.list('-date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Generate AI Insights
  useEffect(() => {
    if (projects.length > 0 && tasks.length > 0 && !aiInsights) {
      generateAIInsights();
    }
  }, [projects.length, tasks.length]);

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const projectSummary = projects.map((p) => {
        const projectTasks = tasks.filter((t) => t.project_id === p.id);
        const completedCount = projectTasks.filter((t) => t.status === 'done').length;
        const blockedCount = projectTasks.filter((t) => t.status === 'blocked').length;
        const healthScore = calculateHealthScore(p, tasks);

        return {
          name: p.name,
          status: p.status,
          tasks: projectTasks.length,
          completed: completedCount,
          blocked: blockedCount,
          health: healthScore,
          budget: p.budget,
          spent: p.budget_spent,
          endDate: p.end_date,
        };
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these projects and provide strategic insights:

${JSON.stringify(projectSummary, null, 2)}

Provide a JSON response with:
1. "trends": Array of 3 key trends you observe across projects
2. "predictions": Array of 2-3 specific projects at risk of delays with reasoning
3. "recommendations": Array of 3 actionable resource allocation or process improvements
4. "velocity": Overall team velocity assessment (high/medium/low) with reasoning

Keep insights concise, actionable, and data-driven.`,
        response_json_schema: {
          type: 'object',
          properties: {
            trends: { type: 'array', items: { type: 'string' } },
            predictions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  project: { type: 'string' },
                  risk: { type: 'string' },
                  reasoning: { type: 'string' },
                },
              },
            },
            recommendations: { type: 'array', items: { type: 'string' } },
            velocity: {
              type: 'object',
              properties: {
                level: { type: 'string' },
                reasoning: { type: 'string' },
              },
            },
          },
        },
      });

      setAiInsights(response);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const analytics = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const onHoldProjects = projects.filter((p) => p.status === 'on_hold').length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
    const overallCompletionRate =
      totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.budget_spent || 0), 0);
    const budgetUtilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

    const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

    // Project status breakdown
    const statusBreakdown = [
      { name: 'Active', value: activeProjects, color: '#3b82f6' },
      { name: 'Completed', value: completedProjects, color: '#10b981' },
      { name: 'On Hold', value: onHoldProjects, color: '#f59e0b' },
      {
        name: 'Planning',
        value: projects.filter((p) => p.status === 'planning').length,
        color: '#8b5cf6',
      },
    ].filter((item) => item.value > 0);

    // Task status breakdown
    const taskStatusBreakdown = [
      { name: 'Done', value: completedTasks, color: '#10b981' },
      { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
      { name: 'Todo', value: tasks.filter((t) => t.status === 'todo').length, color: '#94a3b8' },
      { name: 'Blocked', value: blockedTasks, color: '#ef4444' },
    ].filter((item) => item.value > 0);

    // Project health - projects with completion rate
    const projectHealth = projects
      .map((project) => {
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        const projectCompleted = projectTasks.filter((t) => t.status === 'done').length;
        const completionRate =
          projectTasks.length > 0 ? (projectCompleted / projectTasks.length) * 100 : 0;

        return {
          name: project.name,
          completion: completionRate,
          tasks: projectTasks.length,
          status: project.status,
        };
      })
      .sort((a, b) => b.completion - a.completion)
      .slice(0, 10);

    // Team workload
    const teamWorkload = users
      .map((user) => {
        const userTasks = tasks.filter((t) => t.assigned_to === user.email);
        const activeTasks = userTasks.filter((t) => t.status !== 'done').length;
        const completedTasks = userTasks.filter((t) => t.status === 'done').length;

        return {
          name: user.full_name || user.email.split('@')[0],
          active: activeTasks,
          completed: completedTasks,
          total: userTasks.length,
        };
      })
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // At-risk projects (low completion rate or blocked tasks)
    const atRiskProjects = projects
      .filter((project) => {
        if (project.status === 'completed') {
          return false;
        }
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        const projectBlocked = projectTasks.filter((t) => t.status === 'blocked').length;
        const projectCompleted = projectTasks.filter((t) => t.status === 'done').length;
        const completionRate =
          projectTasks.length > 0 ? (projectCompleted / projectTasks.length) * 100 : 0;

        return projectBlocked > 0 || (projectTasks.length > 0 && completionRate < 30);
      })
      .slice(0, 5);

    // Project health scores
    const projectHealthScores = projects
      .filter((p) => p.status !== 'completed')
      .map((project) => ({
        id: project.id,
        name: project.name,
        score: calculateHealthScore(project, tasks),
        status: project.status,
        tasks: tasks.filter((t) => t.project_id === project.id).length,
      }))
      .sort((a, b) => a.score - b.score);

    // Average health score
    const avgHealthScore =
      projectHealthScores.length > 0
        ? Math.round(
            projectHealthScores.reduce((sum, p) => sum + p.score, 0) / projectHealthScores.length
          )
        : 0;

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
      blockedTasks,
      projectHealthScores,
      avgHealthScore,
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
                  ${(analytics.totalSpent / 1000).toFixed(0)}k / $
                  {(analytics.totalBudget / 1000).toFixed(0)}k
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

      {/* AI Insights Section */}
      {aiInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Trends */}
          <Card className="glass-card border-t-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Key Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {aiInsights.trends?.map((trend, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-0.5">▸</span>
                    <span className="text-gray-700 dark:text-gray-300">{trend}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Delay Predictions */}
          <Card className="glass-card border-t-4 border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-orange-600" />
                Delay Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.predictions?.map((pred, idx) => (
                  <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {pred.project}
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">{pred.risk}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {pred.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="glass-card border-t-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-green-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {aiInsights.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {loadingInsights && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">Generating AI-powered insights...</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Project Health Overview */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Project Health Scores
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-gray-500">Average Health</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.avgHealthScore}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.projectHealthScores.slice(0, 8).map((project) => {
              const healthColor = getHealthColor(project.score);
              return (
                <div key={project.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        to={createPageUrl('ProjectDetail') + `?id=${project.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        <span className={`text-sm font-bold ${healthColor.text}`}>
                          {project.score}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          project.score >= 80
                            ? 'bg-green-500'
                            : project.score >= 60
                              ? 'bg-yellow-500'
                              : project.score >= 40
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${project.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
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
              {analytics.atRiskProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.project_id === project.id);
                const blockedCount = projectTasks.filter((t) => t.status === 'blocked').length;
                const completedCount = projectTasks.filter((t) => t.status === 'done').length;
                const completionRate =
                  projectTasks.length > 0
                    ? ((completedCount / projectTasks.length) * 100).toFixed(0)
                    : 0;

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <Link
                        to={createPageUrl('ProjectDetail') + `?id=${project.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        {blockedCount > 0 && (
                          <span className="text-xs text-red-600">{blockedCount} blocked</span>
                        )}
                        <span className="text-xs text-gray-500">{completionRate}% complete</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl('ProjectDetail') + `?id=${project.id}`}>View</Link>
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
