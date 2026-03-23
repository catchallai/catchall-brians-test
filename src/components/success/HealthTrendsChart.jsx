import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TrendingUp } from 'lucide-react';

export default function HealthTrendsChart({ healthScores }) {
  // Group by status and calculate trends
  const trendData = React.useMemo(() => {
    const grouped = {};

    healthScores.forEach((score) => {
      const date = new Date(score.last_calculated || score.created_date)
        .toISOString()
        .split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, healthy: 0, at_risk: 0, critical: 0, total: 0, avgScore: 0 };
      }

      grouped[date].total++;
      grouped[date].avgScore += score.health_score || 0;
      if (score.health_status === 'healthy') {
        grouped[date].healthy++;
      }
      if (score.health_status === 'at_risk') {
        grouped[date].at_risk++;
      }
      if (score.health_status === 'critical') {
        grouped[date].critical++;
      }
    });

    return Object.values(grouped)
      .map((d) => ({
        ...d,
        avgScore: Math.round(d.avgScore / d.total),
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days
  }, [healthScores]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          Customer Health Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="date" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="healthy"
              stroke="#10b981"
              strokeWidth={2}
              name="Healthy"
            />
            <Line
              type="monotone"
              dataKey="at_risk"
              stroke="#f59e0b"
              strokeWidth={2}
              name="At Risk"
            />
            <Line
              type="monotone"
              dataKey="critical"
              stroke="#ef4444"
              strokeWidth={2}
              name="Critical"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
