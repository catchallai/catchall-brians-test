import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, Edit, Trash, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash,
  complete: CheckCircle,
};

export default function ActivityLog({ projectId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activity-logs', projectId],
    queryFn: async () => {
      if (!projectId) {
        return [];
      }
      const logs = await base44.entities.ActivityLog.filter(
        {
          entity_type: 'project',
          entity_id: projectId,
        },
        '-created_date'
      );
      return logs.slice(0, 20);
    },
    enabled: !!projectId,
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'complete':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.map((log) => {
              const Icon = ICONS[log.action] || Activity;
              return (
                <div
                  key={log.id}
                  className="flex gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <Icon className="w-4 h-4 mt-1 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.user_email?.split('@')[0]}</span>{' '}
                      {log.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.created_date).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getActionColor(log.action)} variant="outline">
                    {log.action}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
