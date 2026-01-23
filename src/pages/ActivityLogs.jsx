import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Plus, Minus, Edit2, Trash2, Download, FileUp, LogIn, LogOut, Mail, Link as LinkIcon } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/components/hooks/useDebounce';

const ACTIVITY_TYPES = {
  created: { icon: Plus, label: 'Created', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  updated: { icon: Edit2, label: 'Updated', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  deleted: { icon: Trash2, label: 'Deleted', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  email_sent: { icon: Mail, label: 'Email Sent', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  status_changed: { icon: LinkIcon, label: 'Status Changed', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  assigned: { icon: Plus, label: 'Assigned', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
  mentioned: { icon: Plus, label: 'Mentioned', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
  note_added: { icon: Plus, label: 'Note Added', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  import: { icon: FileUp, label: 'Imported', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  export: { icon: Download, label: 'Exported', color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300' },
};

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const queryClient = useQueryClient();
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-logs', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Activity.filter(
        { business_id: user.current_business_id },
        '-created_date',
        500
      );
    },
    enabled: !!user?.current_business_id,
    refetchInterval: 10000,
  });

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = !debouncedSearch ||
        activity.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        activity.entity_type?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        activity.performed_by?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesEntityType = entityTypeFilter === 'all' || activity.entity_type === entityTypeFilter;
      const matchesActivityType = activityTypeFilter === 'all' || activity.activity_type === activityTypeFilter;
      
      return matchesSearch && matchesEntityType && matchesActivityType;
    });
  }, [activities, debouncedSearch, entityTypeFilter, activityTypeFilter]);

  // Get unique entity types
  const entityTypes = ['all', ...new Set(activities.map(a => a.entity_type))].filter(Boolean);
  const activityTypes = ['all', ...new Set(activities.map(a => a.activity_type))].filter(Boolean);

  const stats = {
    total: activities.length,
    created: activities.filter(a => a.activity_type === 'created').length,
    updated: activities.filter(a => a.activity_type === 'updated').length,
    deleted: activities.filter(a => a.activity_type === 'deleted').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Track all changes and actions in your CRM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.created}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">Updated</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.updated}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">Deleted</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.deleted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title, entity, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Entities' : type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Activities' : ACTIVITY_TYPES[type]?.label || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No activity logs"
          description="Activities will appear here as you use the CRM"
        />
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const typeConfig = ACTIVITY_TYPES[activity.activity_type] || {
              icon: Clock,
              label: activity.activity_type,
              color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
            };
            const Icon = typeConfig.icon;

            return (
              <div key={activity.id} className="glass-card p-4 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${typeConfig.color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {activity.title || `${activity.activity_type} - ${activity.entity_type}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {activity.performed_by_name || activity.performed_by} • {new Date(activity.created_date).toLocaleDateString()} at {new Date(activity.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {activity.entity_type}
                        </Badge>
                      </div>
                    </div>

                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {activity.metadata.count && `Count: ${activity.metadata.count}`}
                        {activity.metadata.subject && `Subject: ${activity.metadata.subject}`}
                        {activity.metadata.isBulk && '• Bulk action'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}