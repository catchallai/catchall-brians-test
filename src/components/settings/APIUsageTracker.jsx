import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function APIUsageTracker() {
  const { data: usage = [] } = useQuery({
    queryKey: ['api-usage'],
    queryFn: () => base44.entities.APIUsage.list('-date', 30),
  });

  // Generate chart data for last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = last7Days.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayUsage = usage.filter((u) => u.date === dateStr);
    return {
      date: format(date, 'EEE'),
      calls: dayUsage.reduce((sum, u) => sum + (u.calls_count || 0), 0),
      cost: dayUsage.reduce((sum, u) => sum + (u.cost_estimate || 0), 0),
    };
  });

  const totalCalls = usage.reduce((sum, u) => sum + (u.calls_count || 0), 0);
  const totalCost = usage.reduce((sum, u) => sum + (u.cost_estimate || 0), 0);
  const dailyLimit = 1000; // Example limit
  const todayUsage = usage.filter((u) => u.date === format(new Date(), 'yyyy-MM-dd'));
  const todayCalls = todayUsage.reduce((sum, u) => sum + (u.calls_count || 0), 0);
  const usagePercent = Math.min((todayCalls / dailyLimit) * 100, 100);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          API Usage & Rate Limiting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Usage */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Today's API Calls
            </span>
            <span className="text-sm text-gray-500">
              {todayCalls} / {dailyLimit}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          {usagePercent > 80 && (
            <div className="flex items-center gap-2 mt-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Approaching daily limit</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-600">{totalCalls}</p>
            <p className="text-xs text-gray-500">Total Calls (30d)</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600">{Math.round(totalCalls / 30)}</p>
            <p className="text-xs text-gray-500">Avg/Day</p>
          </div>
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-violet-600">${totalCost.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Est. Cost</p>
          </div>
        </div>

        {/* Usage Chart */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Last 7 Days</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Endpoint Breakdown */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">By Endpoint</p>
          <div className="space-y-2">
            {['InvokeLLM', 'SendEmail', 'GenerateImage'].map((endpoint) => {
              const endpointUsage = usage.filter((u) => u.endpoint === endpoint);
              const calls = endpointUsage.reduce((sum, u) => sum + (u.calls_count || 0), 0);
              return (
                <div key={endpoint} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{endpoint}</span>
                  <Badge variant="outline">{calls} calls</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
