import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, ExternalLink, ThumbsUp, ThumbsDown, Minus, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const SENTIMENT_ICONS = {
  positive: { icon: ThumbsUp, color: 'text-emerald-500' },
  neutral: { icon: Minus, color: 'text-gray-500' },
  negative: { icon: ThumbsDown, color: 'text-red-500' },
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-700',
};

const TYPE_COLORS = {
  comparison: 'bg-blue-100 text-blue-700',
  complaint: 'bg-red-100 text-red-700',
  praise: 'bg-emerald-100 text-emerald-700',
  feature_request: 'bg-violet-100 text-violet-700',
  general: 'bg-gray-100 text-gray-700',
};

export default function CompetitorAlertsPanel() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['competitor-alerts'],
    queryFn: () => base44.entities.CompetitorAlert.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CompetitorAlert.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-alerts'] });
      toast.success('Alert updated');
    },
  });

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const newCount = alerts.filter((a) => a.status === 'new').length;
  const highPriorityCount = alerts.filter(
    (a) => a.priority === 'high' && a.status === 'new'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Competitor Alerts</h2>
          <p className="text-sm text-gray-500">Monitor when competitors are mentioned</p>
        </div>
        <div className="flex items-center gap-3">
          {newCount > 0 && <Badge className="bg-red-100 text-red-700">{newCount} new</Badge>}
          {highPriorityCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700">{highPriorityCount} high priority</Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="actioned">Actioned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="glass-card rounded-2xl">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Competitor Alerts
              </h3>
              <p className="text-gray-500">Alerts will appear when competitors are mentioned</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const SentimentIcon = SENTIMENT_ICONS[alert.sentiment]?.icon || Minus;
            const sentimentColor = SENTIMENT_ICONS[alert.sentiment]?.color || 'text-gray-500';

            return (
              <Card
                key={alert.id}
                className={`glass-card rounded-2xl ${alert.status === 'new' ? 'border-l-4 border-l-violet-500' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={PRIORITY_COLORS[alert.priority]}>{alert.priority}</Badge>
                        <Badge className={TYPE_COLORS[alert.alert_type]}>
                          {alert.alert_type?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">{alert.platform}</span>
                        <SentimentIcon className={`w-4 h-4 ${sentimentColor}`} />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        {alert.competitor_name}
                        {alert.mentions_our_brand && (
                          <Badge className="ml-2 bg-violet-100 text-violet-700">Mentions us</Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {alert.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {alert.source_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={alert.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {alert.status === 'new' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({ id: alert.id, status: 'reviewed' })
                          }
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
