import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Phone, Calendar, DollarSign } from 'lucide-react';
import QuotaTrendsChart from '@/components/sales/QuotaTrendsChart';

export default function SalesQuotas() {
  const { data: quotas = [] } = useQuery({
    queryKey: ['sales-quotas'],
    queryFn: () => base44.entities.SalesQuota.list('-achievement_percentage', 50),
  });

  const { data: allQuotas = [] } = useQuery({
    queryKey: ['all-sales-quotas'],
    queryFn: () => base44.entities.SalesQuota.list('-created_date', 200),
  });

  const currentPeriodQuotas = quotas.filter((q) => {
    const now = new Date();
    const start = new Date(q.period_start);
    const end = new Date(q.period_end);
    return now >= start && now <= end;
  });

  const sortedQuotas = [...currentPeriodQuotas].sort(
    (a, b) => (b.achievement_percentage || 0) - (a.achievement_percentage || 0)
  );

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Sales Quotas & Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track team performance</p>
        </div>
      </div>

      {/* Quota Trends */}
      {sortedQuotas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {sortedQuotas.slice(0, 1).map((quota) => (
            <QuotaTrendsChart
              key={quota.id}
              currentQuota={quota}
              previousQuotas={allQuotas
                .filter((q) => q.user_email === quota.user_email && q.id !== quota.id)
                .slice(0, 3)}
            />
          ))}
        </div>
      )}

      {/* Top Performers */}
      {sortedQuotas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedQuotas.slice(0, 3).map((quota, idx) => (
            <Card
              key={quota.id}
              className={`glass-card ${idx === 0 ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {idx === 0 && <Trophy className="w-6 h-6 text-yellow-500" />}
                    {idx === 1 && <Trophy className="w-6 h-6 text-gray-400" />}
                    {idx === 2 && <Trophy className="w-6 h-6 text-orange-600" />}
                    <div>
                      <CardTitle className="text-lg">{quota.user_email?.split('@')[0]}</CardTitle>
                      <p className="text-sm text-gray-500">Rank #{idx + 1}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      quota.achievement_percentage >= 100
                        ? 'bg-green-100 text-green-700'
                        : quota.achievement_percentage >= 75
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {quota.achievement_percentage?.toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-medium">
                      {formatCurrency(quota.current_revenue)} /{' '}
                      {formatCurrency(quota.revenue_target)}
                    </span>
                  </div>
                  <Progress
                    value={(quota.current_revenue / quota.revenue_target) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedQuotas.map((quota, idx) => (
              <div key={quota.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {quota.user_email?.split('@')[0]}
                      </p>
                      <p className="text-sm text-gray-500">{quota.quota_period}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      quota.achievement_percentage >= 100
                        ? 'bg-green-100 text-green-700'
                        : quota.achievement_percentage >= 75
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {quota.achievement_percentage?.toFixed(0)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="font-medium">{formatCurrency(quota.current_revenue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Deals</p>
                      <p className="font-medium">
                        {quota.current_deals} / {quota.deals_target}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-violet-500" />
                    <div>
                      <p className="text-xs text-gray-500">Calls</p>
                      <p className="font-medium">
                        {quota.current_calls} / {quota.calls_target}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Meetings</p>
                      <p className="font-medium">
                        {quota.current_meetings} / {quota.meetings_target}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress value={quota.achievement_percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
