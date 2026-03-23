import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

const STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280' },
  { id: 'qualified', label: 'Qualified', color: '#3b82f6' },
  { id: 'proposal', label: 'Proposal', color: '#8b5cf6' },
  { id: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
  { id: 'won', label: 'Won', color: '#10b981' },
  { id: 'lost', label: 'Lost', color: '#ef4444' },
];

export default function StageDistribution({ deals }) {
  const data = STAGES.map((stage) => ({
    name: stage.label,
    value: deals.filter((d) => d.stage === stage.id).length,
    amount: deals.filter((d) => d.stage === stage.id).reduce((sum, d) => sum + (d.value || 0), 0),
    color: stage.color,
  })).filter((d) => d.value > 0);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value} deals</p>
          <p className="text-sm font-medium text-violet-600">{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" />
            Stage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-gray-400">
          No deals to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-500" />
          Stage Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
