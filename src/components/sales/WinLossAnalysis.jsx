import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WinLossAnalysis({ deals = [] }) {
  const closedDeals = deals.filter((d) => ['closed_won', 'closed_lost'].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === 'closed_won');
  const lostDeals = deals.filter((d) => d.stage === 'closed_lost');

  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;
  const avgDealValue =
    wonDeals.length > 0
      ? wonDeals.reduce((sum, d) => sum + (d.value || 0), 0) / wonDeals.length
      : 0;
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const totalLostValue = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const getLostReasons = () => {
    const reasons = {};
    lostDeals.forEach((d) => {
      const reason = d.lost_reason || 'No reason provided';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    return Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Win Analysis</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {winRate.toFixed(0)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Deals Won</span>
              <span className="font-bold text-gray-900 dark:text-white">{wonDeals.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Won Value</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                ${(totalWonValue / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Value</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${(avgDealValue / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Loss Analysis</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Loss Rate</span>
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {(100 - winRate).toFixed(0)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Deals Lost</span>
              <span className="font-bold text-gray-900 dark:text-white">{lostDeals.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Lost Value</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                ${(totalLostValue / 1000).toFixed(0)}k
              </span>
            </div>
            {getLostReasons().length > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Top loss reasons:</p>
                {getLostReasons().map(([reason, count]) => (
                  <p key={reason} className="text-xs text-gray-500 truncate">
                    {reason} ({count})
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
