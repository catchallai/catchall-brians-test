import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Plus, Pencil, Trash2, Upload, Download, 
  LogIn, LogOut, Clock, User, Filter
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Pagination from '@/components/ui/Pagination';

const ITEMS_PER_PAGE = 50;

const actionConfig = {
  create: { icon: Plus, color: 'bg-emerald-100 text-emerald-700', label: 'Created' },
  update: { icon: Pencil, color: 'bg-blue-100 text-blue-700', label: 'Updated' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-700', label: 'Deleted' },
  import: { icon: Upload, color: 'bg-violet-100 text-violet-700', label: 'Imported' },
  export: { icon: Download, color: 'bg-amber-100 text-amber-700', label: 'Exported' },
  login: { icon: LogIn, color: 'bg-gray-100 text-gray-700', label: 'Logged In' },
  logout: { icon: LogOut, color: 'bg-gray-100 text-gray-700', label: 'Logged Out' },
};

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 1000),
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track all actions performed in the system</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by entity or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.entries(actionConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-0">
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No activity logs found
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedLogs.map((log) => {
                const config = actionConfig[log.action] || actionConfig.update;
                const Icon = config.icon;
                return (
                  <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={config.color}>{config.label}</Badge>
                        <Badge variant="outline">{log.entity_type}</Badge>
                        {log.entity_name && (
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {log.entity_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_email || 'System'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredLogs.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}