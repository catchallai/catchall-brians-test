import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Target, Zap } from 'lucide-react';

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

export default function DealForecasting({ deals }) {
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const forecastData = useMemo(() => {
    // Calculate forecast by stage
    const byStage = {};
    STAGE_ORDER.forEach((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedValue = stageDeals.reduce(
        (sum, d) => sum + (d.value || 0) * ((d.probability || 50) / 100),
        0
      );

      byStage[stage] = {
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        total: totalValue,
        weighted: weightedValue,
        count: stageDeals.length,
      };
    });

    // Calculate win rate by stage
    const wonCount = deals.filter((d) => d.stage === 'won').length;
    const lostCount = deals.filter((d) => d.stage === 'lost').length;
    const totalComplete = wonCount + lostCount;
    const winRate = totalComplete > 0 ? (wonCount / totalComplete) * 100 : 0;

    // Calculate conversion rates from stage to stage
    const conversionRates = {};
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const currentStage = STAGE_ORDER[i];
      const nextStage = STAGE_ORDER[i + 1];

      const currentCount = deals.filter((d) => d.stage === currentStage).length;
      const nextCount = deals.filter((d) => d.stage === nextStage).length;

      conversionRates[`${currentStage}->${nextStage}`] =
        currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
    }

    return {
      byStage: Object.values(byStage),
      winRate,
      conversionRates,
    };
  }, [deals]);

  const projectedRevenue = useMemo(() => {
    const weighted = forecastData.byStage.reduce((sum, stage) => sum + stage.weighted, 0);
    const total = forecastData.byStage.reduce((sum, stage) => sum + stage.total, 0);
    return {
      total,
      weighted,
      conservative: weighted * 0.8, // 80% conservative estimate
      optimistic: weighted * 1.2, // 120% optimistic estimate
    };
  }, [forecastData]);

  const pieData = [
    { name: 'Won', value: deals.filter((d) => d.stage === 'won').length, fill: '#10b981' },
    { name: 'Lost', value: deals.filter((d) => d.stage === 'lost').length, fill: '#ef4444' },
    {
      name: 'In Progress',
      value: deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length,
      fill: '#8b5cf6',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Pipeline</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(projectedRevenue.total)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Weighted Forecast</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(projectedRevenue.weighted)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Based on probabilities</p>
              </div>
              <TrendingUp className="w-8 h-8 text-violet-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conservative (80%)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(projectedRevenue.conservative)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Optimistic (120%)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(projectedRevenue.optimistic)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecastData.byStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Total Value" />
                <Bar dataKey="weighted" fill="#3b82f6" name="Weighted Value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deal Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Deal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Stage Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(forecastData.conversionRates).map(([transition, rate]) => (
              <div key={transition} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{transition}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rate.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
