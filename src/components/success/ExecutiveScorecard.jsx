import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function ExecutiveScorecard() {
  const { data: scorecards = [] } = useQuery({
    queryKey: ['csm-scorecards'],
    queryFn: () => base44.entities.CSMScorecard.list('-period', 100),
  });

  const currentPeriod = scorecards[0];

  if (!currentPeriod) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No scorecard data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            CS Team Scorecard - {currentPeriod.period}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-900/10">
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Health Score</p>
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                {currentPeriod.portfolio_health_score?.toFixed(0)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
              <p className="text-xs text-gray-600 dark:text-gray-400">NRR</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {currentPeriod.nrr_contribution?.toFixed(1)}%
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
              <p className="text-xs text-gray-600 dark:text-gray-400">Renewal Rate</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {currentPeriod.renewal_rate?.toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10">
              <p className="text-xs text-gray-600 dark:text-gray-400">Expansion Revenue</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                ${(currentPeriod.expansion_revenue / 1000)?.toFixed(0)}K
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600">Customers Lost</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{currentPeriod.customers_lost}</p>
            </div>
            <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600">Satisfaction</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {currentPeriod.customer_satisfaction?.toFixed(0)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600">Task Completion</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {currentPeriod.task_completion_rate?.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Top Performers
            </p>
            <div className="space-y-2 text-sm">
              {scorecards.slice(0, 3).map((sc, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    #{sc.rank} {sc.csm_email?.split('@')[0]}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sc.overall_score?.toFixed(0)}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
