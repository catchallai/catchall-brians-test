import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function RevenueMetrics() {
  const { data: revenue = [] } = useQuery({
    queryKey: ['revenue-tracking'],
    queryFn: () => base44.entities.RevenueTracking.list('-period', 100),
  });

  const latestPeriod = revenue[0];

  const metrics = [
    { label: 'ARR', value: latestPeriod?.arr, icon: TrendingUp, color: 'text-violet-600' },
    {
      label: 'NRR',
      value: latestPeriod?.nrr,
      suffix: '%',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'GRR',
      value: latestPeriod?.gross_revenue_retention,
      suffix: '%',
      icon: TrendingDown,
      color: 'text-blue-600',
    },
    {
      label: 'Expansion',
      value: latestPeriod?.expansion_revenue,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>
                    {metric.label === 'ARR'
                      ? `$${(metric.value / 1000)?.toFixed(0)}K`
                      : metric.label === 'Expansion'
                        ? `$${metric.value?.toLocaleString()}`
                        : `${metric.value}${metric.suffix || ''}`}
                  </p>
                </div>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Churn</span>
              <span className="font-medium text-red-600">
                {latestPeriod?.churn_rate?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer LTV</span>
              <span className="font-medium text-violet-600">
                ${latestPeriod?.ltv?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CAC Payback</span>
              <span className="font-medium">{latestPeriod?.payback_period_months} months</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Logo Retention</span>
              <span className="font-medium text-green-600">
                {latestPeriod?.logo_retention?.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
