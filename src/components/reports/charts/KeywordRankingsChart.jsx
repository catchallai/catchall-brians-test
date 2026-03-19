import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, eachWeekOfInterval } from 'date-fns';

export default function KeywordRankingsChart({ dateRange, keywords = [] }) {
  // Generate mock ranking data
  const generateData = () => {
    const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });

    return weeks.map((date, idx) => {
      return {
        date: format(date, 'MMM d'),
        top3: Math.round(5 + Math.sin(idx * 0.5) * 2 + Math.random() * 2),
        top10: Math.round(15 + Math.sin(idx * 0.4) * 5 + Math.random() * 3),
        top20: Math.round(25 + Math.cos(idx * 0.3) * 8 + Math.random() * 4),
        avgPosition: Math.round((12 + Math.sin(idx * 0.2) * 3 + Math.random() * 2) * 10) / 10,
      };
    });
  };

  const data = generateData();

  // Top movers mock data
  const topMovers = [
    { keyword: 'seo tools', change: 12, direction: 'up', position: 3 },
    { keyword: 'marketing automation', change: 8, direction: 'up', position: 7 },
    { keyword: 'crm software', change: -3, direction: 'down', position: 15 },
    { keyword: 'social media management', change: 5, direction: 'up', position: 9 },
  ];

  const latestData = data[data.length - 1] || {};
  const previousData = data[data.length - 2] || {};

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {latestData.top3 || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Top 3</p>
        </div>
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {latestData.top10 || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Top 10</p>
        </div>
        <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {latestData.top20 || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Top 20</p>
        </div>
        <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {latestData.avgPosition || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Pos</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <Line
              type="monotone"
              dataKey="top3"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Top 3"
            />
            <Line
              type="monotone"
              dataKey="top10"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Top 10"
            />
            <Line
              type="monotone"
              dataKey="top20"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Top 20"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Movers */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Top Movers</p>
        <div className="space-y-1">
          {topMovers.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                {item.keyword}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  #{item.position}
                </Badge>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    item.direction === 'up' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {item.direction === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
