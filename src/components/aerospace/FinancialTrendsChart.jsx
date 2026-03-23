import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function FinancialTrendsChart({ companies }) {
  // Prepare data for revenue comparison
  const revenueData = companies
    .filter((c) => c.annual_revenue)
    .slice(0, 8)
    .map((c) => ({
      name: c.company_name.split(' ')[0], // Short name
      revenue: parseFloat(c.annual_revenue.replace(/[^0-9.]/g, '')) || 0,
      marketCap: parseFloat(c.market_cap?.replace(/[^0-9.]/g, '')) || 0,
    }));

  // Growth metrics data
  const growthData = companies
    .filter((c) => c.growth_metrics)
    .slice(0, 6)
    .map((c) => ({
      name: c.company_name.split(' ')[0],
      revenue3yr: parseFloat(c.growth_metrics?.revenue_growth_3yr?.replace(/[^0-9.-]/g, '')) || 0,
      revenue5yr: parseFloat(c.growth_metrics?.revenue_growth_5yr?.replace(/[^0-9.-]/g, '')) || 0,
      employeeGrowth:
        parseFloat(c.growth_metrics?.employee_growth_rate?.replace(/[^0-9.-]/g, '')) || 0,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue & Market Cap Comparison */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Revenue & Market Cap Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($B)" />
              <Bar dataKey="marketCap" fill="#8b5cf6" name="Market Cap ($B)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Growth Metrics Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                label={{ value: '%', angle: -90, position: 'insideLeft' }}
              />
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
                dataKey="revenue3yr"
                stroke="#10b981"
                strokeWidth={2}
                name="3Y Revenue Growth %"
              />
              <Line
                type="monotone"
                dataKey="revenue5yr"
                stroke="#3b82f6"
                strokeWidth={2}
                name="5Y Revenue Growth %"
              />
              <Line
                type="monotone"
                dataKey="employeeGrowth"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Employee Growth %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
