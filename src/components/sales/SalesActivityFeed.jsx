import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Phone, FileText, Calendar, TrendingUp, Clock } from 'lucide-react';

const ACTIVITY_ICONS = {
  deal_won: CheckCircle,
  deal_moved: TrendingUp,
  call_logged: Phone,
  proposal_sent: FileText,
  meeting_scheduled: Calendar,
  follow_up_created: Clock,
};

const ACTIVITY_COLORS = {
  deal_won: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  deal_moved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  call_logged: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  proposal_sent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  meeting_scheduled: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  follow_up_created: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const getActivityDescription = (activity) => {
  switch (activity.type) {
    case 'deal_won':
      return `🎉 ${activity.user_name} closed deal: ${activity.deal_name} for $${(activity.value / 1000).toFixed(0)}k`;
    case 'deal_moved':
      return `→ ${activity.user_name} moved ${activity.deal_name} to ${activity.new_stage}`;
    case 'call_logged':
      return `📞 ${activity.user_name} logged call with ${activity.contact_name}`;
    case 'proposal_sent':
      return `📄 ${activity.user_name} sent proposal to ${activity.contact_name}`;
    case 'meeting_scheduled':
      return `📅 ${activity.user_name} scheduled meeting with ${activity.contact_name}`;
    case 'follow_up_created':
      return `⏰ ${activity.user_name} created follow-up for ${activity.contact_name}`;
    default:
      return activity.description;
  }
};

const formatTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(date).toLocaleDateString();
};

export default function SalesActivityFeed({ activities = [] }) {
  const recentActivities = activities.slice(0, 10);

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Activity</h3>

        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] || Clock;
              const colorClass = ACTIVITY_COLORS[activity.type] || 'bg-gray-100 text-gray-700';

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {getActivityDescription(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(activity.created_date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
