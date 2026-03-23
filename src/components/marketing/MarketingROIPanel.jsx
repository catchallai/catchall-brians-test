import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function MarketingROIPanel({ deals, contacts, utmData }) {
  // Calculate metrics
  const wonDeals = deals.filter((d) => d.stage === 'closed_won');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const totalContacts = contacts.length;
  const customers = contacts.filter((c) => c.status === 'customer').length;

  // Conversion rates
  const leadToCustomer = totalContacts > 0 ? ((customers / totalContacts) * 100).toFixed(1) : 0;
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  // Cost per lead (simulated - in real app would come from campaign costs)
  const estimatedAdSpend = 5000; // Placeholder
  const costPerLead = totalContacts > 0 ? (estimatedAdSpend / totalContacts).toFixed(2) : 0;
  const costPerCustomer = customers > 0 ? (estimatedAdSpend / customers).toFixed(2) : 0;

  // ROI calculation
  const roi =
    estimatedAdSpend > 0
      ? (((totalRevenue - estimatedAdSpend) / estimatedAdSpend) * 100).toFixed(0)
      : 0;

  // Revenue by source
  const revenueBySource = utmData.reduce((acc, item) => {
    if (item.converted && item.conversion_value) {
      const source = item.utm_source || 'direct';
      acc[source] = (acc[source] || 0) + item.conversion_value;
    }
    return acc;
  }, {});

  const sourceChartData = Object.entries(revenueBySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Funnel data
  const funnelData = [
    { name: 'Leads', value: contacts.filter((c) => c.status === 'lead').length },
    { name: 'Prospects', value: contacts.filter((c) => c.status === 'prospect').length },
    { name: 'Customers', value: customers },
    { name: 'Won Deals', value: wonDeals.length },
  ];

  // Monthly trend (simulated)
  const monthlyData = [
    { month: 'Jan', revenue: 12000, leads: 45 },
    { month: 'Feb', revenue: 15000, leads: 52 },
    { month: 'Mar', revenue: 18000, leads: 48 },
    { month: 'Apr', revenue: 14000, leads: 55 },
    { month: 'May', revenue: 22000, leads: 62 },
    { month: 'Jun', revenue: 25000, leads: 70 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Marketing ROI Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Track cost-per-lead, conversion rates, and overall ROI
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">
              ${(totalRevenue / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-500">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-violet-600">{roi}%</p>
            <p className="text-xs text-gray-500">Marketing ROI</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${costPerLead}</p>
            <p className="text-xs text-gray-500">Cost per Lead</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${costPerCustomer}</p>
            <p className="text-xs text-gray-500">Cost per Customer</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{leadToCustomer}%</p>
            <p className="text-xs text-gray-500">Lead → Customer</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${avgDealSize.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Avg Deal Size</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceChartData.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No attribution data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceChartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="glass-card rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                <Bar yAxisId="right" dataKey="leads" fill="#8b5cf6" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
