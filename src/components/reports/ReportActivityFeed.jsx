import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Play,
  Share2,
  MessageSquare,
  Download,
  Calendar,
  Edit,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

const ACTION_CONFIG = {
  created: { icon: Edit, label: 'Created', color: 'bg-blue-100 text-blue-700' },
  updated: { icon: Edit, label: 'Updated', color: 'bg-violet-100 text-violet-700' },
  regenerated: { icon: Play, label: 'Regenerated', color: 'bg-green-100 text-green-700' },
  shared: { icon: Share2, label: 'Shared', color: 'bg-cyan-100 text-cyan-700' },
  unshared: { icon: Share2, label: 'Unshared', color: 'bg-gray-100 text-gray-700' },
  comment_added: { icon: MessageSquare, label: 'Commented', color: 'bg-amber-100 text-amber-700' },
  exported: { icon: Download, label: 'Exported', color: 'bg-indigo-100 text-indigo-700' },
  scheduled: { icon: Calendar, label: 'Scheduled', color: 'bg-pink-100 text-pink-700' },
  version_reverted: { icon: RotateCcw, label: 'Reverted', color: 'bg-orange-100 text-orange-700' },
  deleted: { icon: Trash2, label: 'Deleted', color: 'bg-red-100 text-red-700' },
};

export default function ReportActivityFeed({ reportId, limit = 20 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['report-activity', reportId],
    queryFn: () =>
      reportId
        ? base44.entities.ReportAuditLog.filter({ report_id: reportId }, '-created_date', limit)
        : base44.entities.ReportAuditLog.list('-created_date', limit),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.updated;
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex gap-3 pb-3 border-b dark:border-gray-700 last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.user_email?.split('@')[0] || 'System'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {config.label.toLowerCase()} the report
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {activity.details.shared_with &&
                        `Shared with ${activity.details.shared_with}`}
                      {activity.details.permission && ` (${activity.details.permission})`}
                      {activity.details.reverted_to_version &&
                        `Reverted to version ${activity.details.reverted_to_version}`}
                    </p>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            );
          })}

          {activities.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              No activity yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
