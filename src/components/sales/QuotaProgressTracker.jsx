import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, TrendingUp } from 'lucide-react';

export default function QuotaProgressTracker({ quota, forecast }) {
  if (!quota) {
    return null;
  }

  const achievement = (quota.current_revenue / quota.revenue_target) * 100;
  const daysLeft = quota.period_end
    ? Math.ceil((new Date(quota.period_end) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const dailyTarget = (quota.revenue_target - quota.current_revenue) / Math.max(daysLeft, 1);
  const projectedRevenue = forecast?.predicted_revenue || quota.current_revenue;
  const willMeetQuota = projectedRevenue >= quota.revenue_target;

  const getRiskLevel = () => {
    if (achievement >= 100) {
      return { level: 'On Track', color: 'bg-green-100 text-green-700', icon: '✓' };
    }
    if (achievement >= 75) {
      return { level: 'Good', color: 'bg-blue-100 text-blue-700', icon: '→' };
    }
    if (achievement >= 50) {
      return { level: 'At Risk', color: 'bg-amber-100 text-amber-700', icon: '⚠' };
    }
    return { level: 'Critical', color: 'bg-red-100 text-red-700', icon: '!' };
  };

  const risk = getRiskLevel();
  const confidenceColor =
    (forecast?.confidence_score || 50) >= 75
      ? 'bg-green-100 text-green-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <Card className="glass-card col-span-1 lg:col-span-2">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {quota.user_email?.split('@')[0]}'s Quota
              </h3>
              <p className="text-sm text-gray-500 mt-1">{quota.quota_period}</p>
            </div>
            <Badge className={risk.color}>
              {risk.icon} {risk.level}
            </Badge>
          </div>

          {/* Revenue Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Revenue Target
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                ${(quota.current_revenue / 1000).toFixed(0)}k / $
                {(quota.revenue_target / 1000).toFixed(0)}k
              </span>
            </div>
            <Progress value={Math.min(achievement, 100)} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">{achievement.toFixed(0)}% complete</p>
          </div>

          {/* Forecast */}
          {forecast && (
            <div className="p-3 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Projected Revenue
                  </span>
                </div>
                <Badge className={confidenceColor}>{forecast.confidence_score}% confidence</Badge>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${(forecast.predicted_revenue / 1000).toFixed(0)}k
              </p>
              {willMeetQuota ? (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ On pace to meet quota
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Gap: ${((quota.revenue_target - forecast.predicted_revenue) / 1000).toFixed(0)}k
                </p>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Deals</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {quota.current_deals}/{quota.deals_target}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Calls</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {quota.current_calls}/{quota.calls_target}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Days Left</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{daysLeft}</p>
            </div>
          </div>

          {/* Daily Target */}
          {daysLeft > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Need ${(dailyTarget / 1000).toFixed(0)}k per day
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  to hit target in {daysLeft} days
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
