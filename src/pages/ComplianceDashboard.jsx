import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  FileText,
  Zap,
  Database,
  Users,
  Server,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

const categoryIcons = {
  soc2: Shield,
  sso: Lock,
  audit: FileText,
  encryption: Lock,
  access_control: Users,
  disaster_recovery: Server,
  sla: Zap,
  scim: Database,
  data_retention: Database,
  personnel: Users,
  infrastructure: Server,
};

const statusColors = {
  not_started: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
  completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
  verified: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300',
  blocked: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
};

const statusIcons = {
  not_started: Clock,
  in_progress: Clock,
  completed: CheckCircle,
  verified: CheckCircle,
  blocked: AlertTriangle,
};

export default function ComplianceDashboard() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['compliance-items'],
    queryFn: () => base44.entities.ComplianceItem.list('-priority', 100),
  });

  const categories = [
    { id: 'soc2', label: 'SOC 2', count: 0 },
    { id: 'sso', label: 'SSO', count: 0 },
    { id: 'audit', label: 'Audit Logs', count: 0 },
    { id: 'encryption', label: 'Encryption', count: 0 },
    { id: 'access_control', label: 'Access Control', count: 0 },
    { id: 'disaster_recovery', label: 'Disaster Recovery', count: 0 },
    { id: 'sla', label: 'SLA', count: 0 },
    { id: 'scim', label: 'SCIM', count: 0 },
    { id: 'data_retention', label: 'Data Retention', count: 0 },
    { id: 'personnel', label: 'Personnel', count: 0 },
    { id: 'infrastructure', label: 'Infrastructure', count: 0 },
  ];

  // Count items by category
  categories.forEach((cat) => {
    cat.count = items.filter((item) => item.category === cat.id).length;
  });

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const statusCounts = {
    verified: items.filter((i) => i.status === 'verified').length,
    completed: items.filter((i) => i.status === 'completed').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    blocked: items.filter((i) => i.status === 'blocked').length,
  };

  const completionPercentage = Math.round(
    ((statusCounts.verified + statusCounts.completed) / items.length) * 100
  ) || 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Compliance Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track enterprise security & compliance readiness
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border-violet-200 dark:border-violet-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Overall Progress
              </p>
              <p className="text-3xl font-bold text-violet-600">{completionPercentage}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Verified</p>
              <p className="text-2xl font-bold text-violet-600">{statusCounts.verified}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{statusCounts.completed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Blocked</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.blocked}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          All ({items.length})
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
            className="rounded-full"
          >
            {cat.label} ({cat.count})
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading compliance items...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const IconComponent = categoryIcons[item.category] || Shield;
            const StatusIcon = statusIcons[item.status] || Clock;

            return (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-shadow border-l-4"
                style={{
                  borderLeftColor: {
                    verified: '#10b981',
                    completed: '#3b82f6',
                    in_progress: '#f59e0b',
                    blocked: '#ef4444',
                    not_started: '#9ca3af',
                  }[item.status],
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${statusColors[item.status]}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {item.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusColors[item.status]}`} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Status Badge */}
                  <div>
                    <Badge className={statusColors[item.status]}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Priority</span>
                    <Badge
                      variant="outline"
                      className={
                        item.priority === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700'
                          : item.priority === 'high'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                      }
                    >
                      {item.priority}
                    </Badge>
                  </div>

                  {/* Owner */}
                  {item.owner_email && (
                    <div className="text-xs">
                      <p className="text-gray-500">Owner</p>
                      <p className="text-gray-700 dark:text-gray-300">{item.owner_email}</p>
                    </div>
                  )}

                  {/* Dates */}
                  {item.due_date && (
                    <div className="text-xs">
                      <p className="text-gray-500">Due Date</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {new Date(item.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Blocker */}
                  {item.blocker && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Blocker
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        {item.blocker}
                      </p>
                    </div>
                  )}

                  {/* Evidence Link */}
                  {item.evidence_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(item.evidence_url, '_blank')}
                    >
                      View Evidence
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredItems.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No compliance items in this category</p>
        </div>
      )}
    </div>
  );
}