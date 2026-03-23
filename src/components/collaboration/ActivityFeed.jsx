import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, CheckCircle, Plus, Edit, AlertCircle, AtSign } from 'lucide-react';

import { Mail } from 'lucide-react';

const activityIcons = {
  created: Plus,
  updated: Edit,
  note_added: MessageSquare,
  status_changed: CheckCircle,
  assigned: CheckCircle,
  mentioned: AtSign,
  email_sent: Mail,
};

const activityColors = {
  created: 'bg-blue-100 text-blue-800',
  updated: 'bg-violet-100 text-violet-800',
  note_added: 'bg-emerald-100 text-emerald-800',
  status_changed: 'bg-amber-100 text-amber-800',
  assigned: 'bg-pink-100 text-pink-800',
  mentioned: 'bg-orange-100 text-orange-800',
  email_sent: 'bg-blue-100 text-blue-800',
};

export default function ActivityFeed({ entityType, entityId }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', entityType, entityId],
    queryFn: async () => {
      if (!entityId) {
        return [];
      }
      return await base44.entities.Activity.filter(
        {
          entity_type: entityType,
          entity_id: entityId,
        },
        '-created_date',
        50
      );
    },
    enabled: !!entityId,
  });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">No activities yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type] || AlertCircle;
            return (
              <div
                key={activity.id}
                className="flex gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${activityColors[activity.activity_type]}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {activity.performed_by_name || activity.performed_by}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {activity.description}
                    </p>
                  )}
                  {activity.mentions && activity.mentions.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <AtSign className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        Mentioned: {activity.mentions.join(', ')}
                      </span>
                    </div>
                  )}
                  {activity.activity_type === 'email_sent' && activity.metadata && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                        <strong>Subject:</strong> {activity.metadata.subject}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <strong>To:</strong> {activity.metadata.to}
                      </p>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 max-h-24 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: activity.description }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
