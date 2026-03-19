import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox as InboxIcon, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Inbox() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['task-assignments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.TaskAssignment.filter(
        { assigned_to: user.email },
        '-created_date'
      );
    },
    enabled: !!user?.email,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Task.filter({ assigned_to: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['my-issues'],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Issue.filter({ assigned_to: user.email });
    },
    enabled: !!user?.email,
  });

  const markReadMutation = useMutation({
    mutationFn: (assignmentId) =>
      base44.entities.TaskAssignment.update(assignmentId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId) => base44.entities.TaskAssignment.delete(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
    },
  });

  const unreadCount = assignments.filter((a) => !a.is_read).length;
  const overdueCount = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length;

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'unread') return !a.is_read;
    if (filter === 'read') return a.is_read;
    return true;
  });

  const getEntityDetails = (assignment) => {
    if (assignment.entity_type === 'task') {
      return tasks.find((t) => t.id === assignment.task_id);
    }
    if (assignment.entity_type === 'issue') {
      return issues.find((i) => i.id === assignment.task_id);
    }
    return null;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inbox</h1>
        <p className="text-gray-500 mt-1">Your daily assignments and notifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-3xl font-bold">{unreadCount}</p>
              </div>
              <InboxIcon className="w-8 h-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tasks</p>
                <p className="text-3xl font-bold">{tasks.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Issues</p>
                <p className="text-3xl font-bold">{issues.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="issues">My Issues ({issues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-3">
          <div className="flex gap-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Read
            </Button>
          </div>

          {filteredAssignments.length === 0 ? (
            <Card className="p-8 text-center">
              <InboxIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No assignments yet</p>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => {
              const entity = getEntityDetails(assignment);
              return (
                <Card
                  key={assignment.id}
                  className={`glass-card ${!assignment.is_read ? 'border-l-4 border-l-violet-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{assignment.entity_type}</Badge>
                          {entity?.priority && (
                            <Badge className={getPriorityColor(entity.priority)}>
                              {entity.priority}
                            </Badge>
                          )}
                          {!assignment.is_read && (
                            <Badge className="bg-violet-100 text-violet-800">New</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {entity?.title || 'Assignment'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Assigned by {assignment.assigned_by?.split('@')[0]} •{' '}
                          {new Date(assignment.created_date).toLocaleDateString()}
                        </p>
                        {entity?.due_date && (
                          <p className="text-sm text-gray-500 mt-1">
                            Due: {new Date(entity.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!assignment.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markReadMutation.mutate(assignment.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-3">
          {tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No tasks assigned to you</p>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{task.status}</Badge>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                      {task.due_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Link to={`${createPageUrl('ProjectDetail')}?id=${task.project_id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="issues" className="space-y-3">
          {issues.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No issues assigned to you</p>
            </Card>
          ) : (
            issues.map((issue) => (
              <Card key={issue.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{issue.issue_type}</Badge>
                        <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{issue.title}</h3>
                      {issue.due_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(issue.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
