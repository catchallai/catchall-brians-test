import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TopPagesChart({ dateRange }) {
  const topPages = [
    { page: '/blog/seo-guide', views: 12500, change: 15, bounce: 32 },
    { page: '/pricing', views: 8900, change: 8, bounce: 28 },
    { page: '/features', views: 7200, change: -3, bounce: 35 },
    { page: '/blog/marketing-tips', views: 5800, change: 22, bounce: 40 },
    { page: '/contact', views: 4100, change: 5, bounce: 25 },
    { page: '/demo', views: 3500, change: 12, bounce: 18 },
  ];

  const chartData = topPages.map((p) => ({
    name: p.page.replace('/blog/', '').replace('/', '').slice(0, 15),
    views: p.views,
  }));

  const totalViews = topPages.reduce((sum, p) => sum + p.views, 0);
  const avgBounce = (topPages.reduce((sum, p) => sum + p.bounce, 0) / topPages.length).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {(totalViews / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Top Pages Views</p>
        </div>
        <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgBounce}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Bounce Rate</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value) => [value.toLocaleString() + ' views', 'Views']}
            />
            <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Pages List */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Page Performance
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {topPages.slice(0, 4).map((page, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-700 dark:text-gray-300 truncate flex-1 text-xs">
                {page.page}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{(page.views / 1000).toFixed(1)}K</span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    page.change > 0
                      ? 'text-emerald-600'
                      : page.change < 0
                        ? 'text-red-500'
                        : 'text-gray-400'
                  }`}
                >
                  {page.change > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : page.change < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {Math.abs(page.change)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
