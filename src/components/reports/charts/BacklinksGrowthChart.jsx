import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Link2 } from 'lucide-react';
import { format, eachWeekOfInterval } from 'date-fns';

export default function BacklinksGrowthChart({ dateRange, backlinks = [] }) {
  // Generate mock data
  const generateData = () => {
    const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
    let cumulative = 1200;

    return weeks.map((date, idx) => {
      const newLinks = Math.round(15 + Math.random() * 25);
      const lostLinks = Math.round(3 + Math.random() * 8);
      cumulative += newLinks - lostLinks;

      return {
        date: format(date, 'MMM d'),
        total: cumulative,
        new: newLinks,
        lost: lostLinks,
        dofollow: Math.round(cumulative * 0.7),
        nofollow: Math.round(cumulative * 0.3),
      };
    });
  };

  const data = generateData();
  const latestData = data[data.length - 1] || {};
  const previousData = data[0] || {};

  const netGrowth = latestData.total - previousData.total;
  const growthPercent = ((netGrowth / previousData.total) * 100).toFixed(1);

  // Top referring domains mock data
  const topDomains = [
    { domain: 'techcrunch.com', links: 24, da: 94 },
    { domain: 'forbes.com', links: 18, da: 95 },
    { domain: 'entrepreneur.com', links: 15, da: 88 },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {(latestData.total / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Links</p>
        </div>
        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{netGrowth}</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Net Growth</p>
        </div>
        <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {latestData.dofollow || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Dofollow</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBacklinks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-gray-700"
            />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              fill="url(#colorBacklinks)"
              strokeWidth={2}
              name="Total Backlinks"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Referring Domains */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Top Referring Domains
        </p>
        <div className="space-y-1">
          {topDomains.map((domain, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2">
                <Link2 className="w-3 h-3 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{domain.domain}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  DA {domain.da}
                </Badge>
                <span className="text-xs text-gray-500">{domain.links} links</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
