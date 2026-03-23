import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import InteractiveAreaChart from '@/components/charts/InteractiveAreaChart';

export default function PerformanceChart({ data, title, dataKeys = ['deals', 'mentions'] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <InteractiveAreaChart
          data={data}
          dataKeys={dataKeys}
          xKey="name"
          height={256}
          showBrush={data?.length > 10}
          showZoom={true}
        />
      </CardContent>
    </Card>
  );
}
