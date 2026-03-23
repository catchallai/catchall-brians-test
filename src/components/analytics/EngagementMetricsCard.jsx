import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MousePointer, Layers, ArrowDown } from 'lucide-react';

export default function EngagementMetricsCard({ data }) {
  // SyberJet engagement metrics - high engagement for luxury aviation research
  const metrics = data || {
    pagesPerSession: 5.4,
    avgScrollDepth: 76,
    clickRate: 4.8,
    interactionRate: 68,
  };

  const items = [
    {
      label: 'Pages/Session',
      value: metrics.pagesPerSession,
      suffix: '',
      icon: Layers,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      progress: (metrics.pagesPerSession / 5) * 100,
    },
    {
      label: 'Scroll Depth',
      value: metrics.avgScrollDepth,
      suffix: '%',
      icon: ArrowDown,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      progress: metrics.avgScrollDepth,
    },
    {
      label: 'Click Rate',
      value: metrics.clickRate,
      suffix: '%',
      icon: MousePointer,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      progress: (metrics.clickRate / 10) * 100,
    },
    {
      label: 'Interaction',
      value: metrics.interactionRate,
      suffix: '%',
      icon: Activity,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      progress: metrics.interactionRate,
    },
  ];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500" />
          Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.label} className={`p-3 rounded-xl ${item.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {item.value}
                {item.suffix}
              </p>
              <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min(item.progress, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
