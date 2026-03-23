import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

const STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280' },
  { id: 'qualified', label: 'Qualified', color: '#3b82f6' },
  { id: 'proposal', label: 'Proposal', color: '#8b5cf6' },
  { id: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
  { id: 'won', label: 'Won', color: '#10b981' },
];

export default function SalesFunnel({ deals }) {
  const stageCounts = STAGES.map((stage) => ({
    ...stage,
    count: deals.filter((d) => d.stage === stage.id).length,
    value: deals.filter((d) => d.stage === stage.id).reduce((sum, d) => sum + (d.value || 0), 0),
  }));

  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Calculate conversion rates
  const conversionRates = stageCounts.map((stage, idx) => {
    if (idx === 0) {
      return 100;
    }
    const prevCount = stageCounts[idx - 1].count;
    if (prevCount === 0) {
      return 0;
    }
    return Math.round((stage.count / prevCount) * 100);
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-violet-500" />
          Sales Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stageCounts.map((stage, idx) => {
            const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const minWidth = 20; // Minimum width percentage
            const displayWidth = Math.max(widthPercent, stage.count > 0 ? minWidth : 5);

            return (
              <div key={stage.id} className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-medium text-gray-900">{stage.label}</p>
                    <p className="text-xs text-gray-500">{stage.count} deals</p>
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className="h-10 rounded-r-lg flex items-center justify-end px-3 transition-all duration-300"
                      style={{
                        width: `${displayWidth}%`,
                        backgroundColor: stage.color,
                        minWidth: '60px',
                      }}
                    >
                      <span className="text-white text-sm font-medium">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                  </div>
                  {idx > 0 && (
                    <div className="w-16 text-right shrink-0">
                      <span
                        className={`text-xs font-medium ${
                          conversionRates[idx] >= 50
                            ? 'text-emerald-600'
                            : conversionRates[idx] >= 25
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }`}
                      >
                        {conversionRates[idx]}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel Summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
            <p className="text-xs text-gray-500">Total Deals</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              {deals.filter((d) => d.stage === 'won').length}
            </p>
            <p className="text-xs text-gray-500">Won</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-violet-600">
              {deals.length > 0
                ? `${Math.round((deals.filter((d) => d.stage === 'won').length / deals.length) * 100)}%`
                : '0%'}
            </p>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
