import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

const COLORS = {
  identified: '#8b5cf6',
  contacted: '#3b82f6',
  qualified: '#f59e0b',
  closed_won: '#10b981',
  closed_lost: '#ef4444',
};

export default function OpportunityConversionChart({ opportunities }) {
  const chartData = React.useMemo(() => {
    const statusCounts = {};

    opportunities.forEach((opp) => {
      const status = opp.status || 'identified';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
      color: COLORS[status],
    }));
  }, [opportunities]);

  const totalOpps = opportunities.length;
  const closedWon = opportunities.filter((o) => o.status === 'closed_won').length;
  const conversionRate = totalOpps > 0 ? Math.round((closedWon / totalOpps) * 100) : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          Opportunity Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-violet-600">{conversionRate}%</p>
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-xs text-gray-400">
              {closedWon} / {totalOpps} opportunities
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
