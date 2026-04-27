import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

const severityConfig = {
  critical: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
  high: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  medium: { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  low: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
};

export default function CompetitorReportCard({ report, competitorName, onClick }) {
  const alertCount = report.alerts?.length || 0;
  const criticalAlerts =
    report.alerts?.filter((a) => a.severity === 'critical' || a.severity === 'high').length || 0;

  return (
    <Card
      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              {competitorName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {report.report_type === 'daily' ? 'Daily' : 'Weekly'} Report
              </Badge>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {report.period_end ? format(new Date(report.period_end), 'MMM d, yyyy') : 'N/A'}
              </span>
            </div>
          </div>
          {criticalAlerts > 0 && (
            <Badge className="bg-red-100 text-red-700 border-0">
              {criticalAlerts} Alert{criticalAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key Metrics */}
        {report.metrics && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Followers</p>
              <p
                className={`text-sm font-semibold ${report.metrics.follower_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {report.metrics.follower_change >= 0 ? '+' : ''}
                {report.metrics.follower_change_percent?.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Engagement</p>
              <p
                className={`text-sm font-semibold ${report.metrics.engagement_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {report.metrics.engagement_change >= 0 ? '+' : ''}
                {report.metrics.engagement_change?.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Posts</p>
              <p className="text-sm font-semibold text-gray-900">
                {report.metrics.posts_count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Sentiment */}
        {report.sentiment_analysis && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sentiment:</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full"
                style={{ width: `${report.sentiment_analysis.positive_percent || 0}%` }}
              />
              <div
                className="bg-gray-300 h-full"
                style={{ width: `${report.sentiment_analysis.neutral_percent || 0}%` }}
              />
              <div
                className="bg-red-400 h-full"
                style={{ width: `${report.sentiment_analysis.negative_percent || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Alerts Preview */}
        {alertCount > 0 && (
          <div className="space-y-1">
            {report.alerts.slice(0, 2).map((alert, i) => {
              const config = severityConfig[alert.severity] || severityConfig.low;
              const Icon = config.icon;
              return (
                <div key={i} className={`p-2 rounded-lg ${config.color} flex items-center gap-2`}>
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="text-xs truncate">{alert.title}</span>
                </div>
              );
            })}
            {alertCount > 2 && (
              <p className="text-xs text-gray-500 text-center">+{alertCount - 2} more alerts</p>
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full gap-1 text-violet-600">
          View Full Report <ChevronRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
