import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';

export default function SalesPipelineAnalytics({ deals, onExport }) {
  const calculateMetrics = useMemo(() => {
    const activeDeals = deals.filter((d) => !['won', 'lost'].includes(d.stage));
    const wonDeals = deals.filter((d) => d.stage === 'won');
    const lostDeals = deals.filter((d) => d.stage === 'lost');

    const totalPipeline = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalWon = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalLost = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    const winRate =
      wonDeals.length > 0
        ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(1)
        : 0;

    const avgDealSize =
      activeDeals.length > 0 ? (totalPipeline / activeDeals.length).toFixed(0) : 0;

    const stageCounts = {
      lead: deals.filter((d) => d.stage === 'lead').length,
      qualified: deals.filter((d) => d.stage === 'qualified').length,
      proposal: deals.filter((d) => d.stage === 'proposal').length,
      negotiation: deals.filter((d) => d.stage === 'negotiation').length,
    };

    const stageValues = {
      lead: deals.filter((d) => d.stage === 'lead').reduce((sum, d) => sum + (d.value || 0), 0),
      qualified: deals
        .filter((d) => d.stage === 'qualified')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      proposal: deals
        .filter((d) => d.stage === 'proposal')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      negotiation: deals
        .filter((d) => d.stage === 'negotiation')
        .reduce((sum, d) => sum + (d.value || 0), 0),
    };

    return {
      totalPipeline,
      totalWon,
      totalLost,
      winRate,
      avgDealSize,
      stageCounts,
      stageValues,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
    };
  }, [deals]);

  const stageData = [
    {
      name: 'Lead',
      value: calculateMetrics.stageCounts.lead,
      revenue: calculateMetrics.stageValues.lead,
    },
    {
      name: 'Qualified',
      value: calculateMetrics.stageCounts.qualified,
      revenue: calculateMetrics.stageValues.qualified,
    },
    {
      name: 'Proposal',
      value: calculateMetrics.stageCounts.proposal,
      revenue: calculateMetrics.stageValues.proposal,
    },
    {
      name: 'Negotiation',
      value: calculateMetrics.stageCounts.negotiation,
      revenue: calculateMetrics.stageValues.negotiation,
    },
  ];

  const conversionData = [
    {
      stage: 'Lead → Qualified',
      rate:
        calculateMetrics.stageCounts.qualified > 0
          ? (
              (calculateMetrics.stageCounts.qualified / calculateMetrics.stageCounts.lead) *
              100
            ).toFixed(1)
          : 0,
    },
    {
      stage: 'Qualified → Proposal',
      rate:
        calculateMetrics.stageCounts.proposal > 0
          ? (
              (calculateMetrics.stageCounts.proposal / calculateMetrics.stageCounts.qualified) *
              100
            ).toFixed(1)
          : 0,
    },
    {
      stage: 'Proposal → Negotiation',
      rate:
        calculateMetrics.stageCounts.negotiation > 0
          ? (
              (calculateMetrics.stageCounts.negotiation / calculateMetrics.stageCounts.proposal) *
              100
            ).toFixed(1)
          : 0,
    },
    {
      stage: 'Negotiation → Won',
      rate:
        calculateMetrics.wonDeals > 0
          ? ((calculateMetrics.wonDeals / calculateMetrics.stageCounts.negotiation) * 100).toFixed(
              1
            )
          : 0,
    },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Pipeline Value
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(calculateMetrics.totalPipeline)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Active Deals: {calculateMetrics.activeDeals}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Win Rate</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {calculateMetrics.winRate}%
            </p>
            <p className="text-xs text-gray-400 mt-2">{calculateMetrics.wonDeals} won deals</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Avg Deal Size
            </p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(calculateMetrics.avgDealSize)}
            </p>
            <p className="text-xs text-gray-400 mt-2">Based on active deals</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total Won</p>
            <p className="text-lg sm:text-2xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(calculateMetrics.totalWon)}
            </p>
            <p className="text-xs text-gray-400 mt-2">{calculateMetrics.wonDeals} deals closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Distribution by Stage */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Deal Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${value} deals`, 'Count']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Stage */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Revenue Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Stage Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionData.map((item, idx) => {
              const rate = parseFloat(item.rate) || 0;
              const isPositive = rate >= 40;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.stage}
                    </span>
                    <span
                      className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onExport?.()} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
