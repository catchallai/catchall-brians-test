import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Minus, MessageSquare, AlertTriangle } from 'lucide-react';

export default function SocialSentimentCard({ mentions, alerts }) {
  const sentimentCounts = {
    positive: mentions.filter((m) => m.sentiment === 'positive').length,
    neutral: mentions.filter((m) => m.sentiment === 'neutral').length,
    negative: mentions.filter((m) => m.sentiment === 'negative').length,
  };

  const total = mentions.length || 1;
  const positivePercent = Math.round((sentimentCounts.positive / total) * 100);
  const neutralPercent = Math.round((sentimentCounts.neutral / total) * 100);
  const negativePercent = Math.round((sentimentCounts.negative / total) * 100);

  const unreadAlerts = alerts.filter((a) => !a.is_read).length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            Social Sentiment
          </span>
          {unreadAlerts > 0 && (
            <Badge
              className={`${criticalAlerts > 0 ? 'bg-red-500' : 'bg-orange-500'} text-white border-0`}
            >
              {unreadAlerts} alert{unreadAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment Bar */}
        <div className="space-y-2">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${positivePercent}%` }}
            />
            <div
              className="bg-gray-300 dark:bg-gray-600 transition-all"
              style={{ width: `${neutralPercent}%` }}
            />
            <div className="bg-red-500 transition-all" style={{ width: `${negativePercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 text-emerald-500" /> {positivePercent}%
            </span>
            <span className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-gray-400" /> {neutralPercent}%
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="w-3 h-3 text-red-500" /> {negativePercent}%
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {sentimentCounts.positive}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Positive</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300">
              {sentimentCounts.neutral}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Neutral</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {sentimentCounts.negative}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Negative</p>
          </div>
        </div>

        {/* Critical Alert Warning */}
        {criticalAlerts > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">
              {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} requiring attention
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
