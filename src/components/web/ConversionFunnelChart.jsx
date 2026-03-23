import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';

export default function ConversionFunnelChart({ funnel }) {
  if (!funnel) {
    return null;
  }

  const maxVisitors = funnel.total_entered || 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{funnel.funnel_name}</span>
          <Badge className="bg-emerald-100 text-emerald-800">
            {funnel.conversion_rate}% conversion
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnel.step_analytics?.map((step, idx) => {
          const widthPercent = maxVisitors > 0 ? (step.visitors / maxVisitors) * 100 : 0;

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Step {step.step_order}: {funnel.steps?.[idx]?.step_name || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500">{step.visitors} visitors</span>
              </div>

              <div className="relative">
                <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-violet-600 h-full transition-all flex items-center justify-between px-4"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-white text-sm font-medium">
                      {Math.round(widthPercent)}%
                    </span>
                  </div>
                </div>

                {step.drop_off > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <TrendingDown className="w-3 h-3" />
                    <span>
                      {step.drop_off} dropped ({step.drop_off_rate}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-1 text-xs text-gray-500">
                Avg time: {Math.round(step.avg_time_on_step)}s
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Entered Funnel:</span>
            <span>{funnel.total_entered}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="font-medium">Completed:</span>
            <span className="text-emerald-600 font-semibold">{funnel.total_completed}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
