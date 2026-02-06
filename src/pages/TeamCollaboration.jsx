import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, 
  Briefcase, 
  CalendarDays, 
  MessageSquare, 
  FolderOpen,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  Folder
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContractorManagement from '@/components/collaboration/ContractorManagement';
import MediaFolderManager from '@/components/collaboration/MediaFolderManager';

export default function TeamCollaboration() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 5)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      if (!user) return [];
      const allTasks = await base44.entities.Task.list('-due_date', 10);
      return allTasks.filter(t => 
        t.assigned_to?.includes(user.email) && t.status !== 'completed'
      );
    },
    enabled: !!user
  });

  const { data: calendarPosts = [] } = useQuery({
    queryKey: ['upcoming-calendar-posts'],
    queryFn: async () => {
      const posts = await base44.entities.CalendarPost.list('scheduled_date', 5);
      return posts.filter(p => 
        new Date(p.scheduled_date) >= new Date() && 
        (p.status === 'pending_approval' || p.status === 'approved')
      );
    }
  });

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => base44.entities.Space.list('-updated_date', 5)
  });

  const quickLinks = [
    {
      title: 'Projects',
      description: 'Manage team projects and tasks',
      icon: Briefcase,
      link: 'Projects',
      color: 'bg-blue-500'
    },
    {
      title: 'Project Calendar',
      description: 'View project timelines',
      icon: CalendarDays,
      link: 'ProjectCalendar',
      color: 'bg-purple-500'
    },
    {
      title: 'Social Calendar',
      description: 'Collaborate on social posts',
      icon: CalendarDays,
      link: 'SocialCalendar',
      color: 'bg-cyan-500'
    },
    {
      title: 'ICS Chat',
      description: 'Team messaging & calls',
      icon: MessageSquare,
      link: 'ICS',
      color: 'bg-green-500'
    },
    {
      title: 'Spaces',
      description: 'Shared documentation',
      icon: FolderOpen,
      link: 'Spaces',
      color: 'bg-orange-500'
    },
    {
      title: 'Inbox',
      description: 'Team notifications',
      icon: MessageSquare,
      link: 'Inbox',
      color: 'bg-pink-500'
    },
    {
      title: 'Contractors',
      description: 'Manage contractors & schedule',
      icon: UserPlus,
      link: null,
      color: 'bg-violet-500'
    },
    {
      title: 'Media Folders',
      description: 'Organize photos & videos',
      icon: Folder,
      link: null,
      color: 'bg-emerald-500'
    }
  ];

  const statusColors = {
    'not_started': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'on_hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  };

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Collaboration</h1>
          <p className="text-gray-500 mt-1">Your hub for projects, calendars, and team coordination</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {quickLinks.map((item) => (
          item.link ? (
            <Link key={item.link} to={createPageUrl(item.link)}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card key={item.title} className="hover:shadow-lg transition-all h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500">{item.description}</p>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {/* Contractors & Media Management */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="media">Media Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Active Projects
            </CardTitle>
            <Link to={createPageUrl('Projects')}>
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No active projects</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                    <div className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{project.name}</h4>
                        <Badge className={statusColors[project.status] || statusColors.not_started}>
                          {project.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                      {project.due_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CalendarDays className="w-3 h-3" />
                          Due {format(new Date(project.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              My Tasks
              <Badge variant="outline">{tasks.length}</Badge>
            </CardTitle>
            <Link to={createPageUrl('Projects')}>
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No pending tasks</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {task.title}
                          </h4>
                          {task.priority && (
                            <AlertCircle className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                          )}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.due_date), 'MMM d')}
                          </div>
                        )}
                      </div>
                      <Badge className={statusColors[task.status] || statusColors.not_started} variant="outline">
                        {task.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Calendar Posts */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Upcoming Posts
            </CardTitle>
            <Link to={createPageUrl('SocialCalendar')}>
              <Button variant="ghost" size="sm" className="gap-1">
                View Calendar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {calendarPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No upcoming posts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {calendarPosts.map((post) => (
                  <div key={post.id} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {post.title || 'Untitled Post'}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {post.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays className="w-3 h-3" />
                      {format(new Date(post.scheduled_date), 'MMM d, yyyy')}
                      {post.scheduled_time && ` at ${post.scheduled_time}`}
                    </div>
                    {post.platforms && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.platforms.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spaces & Documentation */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Team Spaces
            </CardTitle>
            <Link to={createPageUrl('Spaces')}>
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {spaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No spaces created</p>
              </div>
            ) : (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <Link key={space.id} to={createPageUrl(`SpaceDetail?id=${space.id}`)}>
                    <div className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {space.name}
                          </h4>
                          {space.description && (
                            <p className="text-xs text-gray-500 truncate">{space.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="contractors">
          <ContractorManagement />
        </TabsContent>

        <TabsContent value="media">
          <MediaFolderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}