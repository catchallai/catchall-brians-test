import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, eachDayOfInterval, eachWeekOfInterval, differenceInDays } from 'date-fns';

export default function TrafficTrendsChart({ dateRange }) {
  const days = differenceInDays(dateRange.to, dateRange.from);

  // Generate mock data based on date range
  const generateData = () => {
    const intervals =
      days > 60
        ? eachWeekOfInterval({ start: dateRange.from, end: dateRange.to })
        : eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    return intervals.map((date, idx) => {
      const baseVisitors = 1200 + Math.sin(idx * 0.3) * 400;
      const basePageviews = baseVisitors * (2.5 + Math.random() * 0.5);
      const baseSessions = baseVisitors * (1.1 + Math.random() * 0.2);

      return {
        date: format(date, days > 60 ? 'MMM d' : 'MMM d'),
        visitors: Math.round(baseVisitors + Math.random() * 200),
        pageviews: Math.round(basePageviews + Math.random() * 300),
        sessions: Math.round(baseSessions + Math.random() * 100),
      };
    });
  };

  const data = generateData();

  const totalVisitors = data.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageviews = data.reduce((sum, d) => sum + d.pageviews, 0);
  const avgSessionDuration = '3m 24s';

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {(totalVisitors / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Visitors</p>
        </div>
        <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {(totalPageviews / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pageviews</p>
        </div>
        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {avgSessionDuration}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Duration</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="dark:fill-gray-400"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="dark:fill-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#3b82f6"
              fill="url(#colorVisitors)"
              strokeWidth={2}
              name="Visitors"
            />
            <Area
              type="monotone"
              dataKey="pageviews"
              stroke="#8b5cf6"
              fill="url(#colorPageviews)"
              strokeWidth={2}
              name="Pageviews"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
