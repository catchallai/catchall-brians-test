import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function QuotaTrendsChart({ currentQuota, previousQuotas = [] }) {
  if (!currentQuota) {
    return null;
  }

  const prevQuota = previousQuotas[0];
  const quotaChange = prevQuota
    ? ((currentQuota.achievement_percentage - prevQuota.achievement_percentage) /
        prevQuota.achievement_percentage) *
      100
    : 0;

  const revenueChange = prevQuota
    ? ((currentQuota.current_revenue - prevQuota.current_revenue) / prevQuota.current_revenue) * 100
    : 0;

  const trend = quotaChange >= 0 ? 'up' : 'down';
  const Icon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quota Trends</h3>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Achievement Change</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {quotaChange.toFixed(1)}%
                </p>
              </div>
              <Icon className={`w-8 h-8 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            {prevQuota && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                vs previous period: {prevQuota.achievement_percentage?.toFixed(0)}%
              </p>
            )}
          </div>

          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Change</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {revenueChange.toFixed(1)}%
                </p>
              </div>
              <Icon
                className={`w-8 h-8 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
            </div>
            {prevQuota && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Previous: ${(prevQuota.current_revenue / 1000).toFixed(0)}k
              </p>
            )}
          </div>

          {previousQuotas.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Historical Achievement
              </p>
              <div className="space-y-2">
                {previousQuotas.slice(0, 3).map((quota, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{quota.quota_period}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(quota.achievement_percentage, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white w-10 text-right">
                        {quota.achievement_percentage?.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
