import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, DollarSign } from 'lucide-react';

export default function TrendCharts({ company }) {
  // Generate simulated historical data based on growth metrics
  const generateRevenueData = () => {
    const currentRevenue = parseFloat(company.annual_revenue?.replace(/[^0-9.]/g, '')) || 100;
    const growth3yr =
      parseFloat(company.growth_metrics?.revenue_growth_3yr?.replace(/[^0-9.-]/g, '')) || 15;
    const growth5yr =
      parseFloat(company.growth_metrics?.revenue_growth_5yr?.replace(/[^0-9.-]/g, '')) || 12;

    const avgAnnualGrowth = (growth3yr + growth5yr) / 2 / 100;

    return [
      { year: '2020', revenue: Math.round(currentRevenue / Math.pow(1 + avgAnnualGrowth, 5)) },
      { year: '2021', revenue: Math.round(currentRevenue / Math.pow(1 + avgAnnualGrowth, 4)) },
      { year: '2022', revenue: Math.round(currentRevenue / Math.pow(1 + avgAnnualGrowth, 3)) },
      { year: '2023', revenue: Math.round(currentRevenue / Math.pow(1 + avgAnnualGrowth, 2)) },
      { year: '2024', revenue: Math.round(currentRevenue / (1 + avgAnnualGrowth)) },
      { year: '2025', revenue: Math.round(currentRevenue) },
    ];
  };

  const generateEmployeeData = () => {
    const currentEmployees = company.employee_count || 1000;
    const employeeGrowth =
      parseFloat(company.growth_metrics?.employee_growth_rate?.replace(/[^0-9.-]/g, '')) || 10;
    const avgAnnualGrowth = employeeGrowth / 100;

    return [
      { year: '2020', employees: Math.round(currentEmployees / Math.pow(1 + avgAnnualGrowth, 5)) },
      { year: '2021', employees: Math.round(currentEmployees / Math.pow(1 + avgAnnualGrowth, 4)) },
      { year: '2022', employees: Math.round(currentEmployees / Math.pow(1 + avgAnnualGrowth, 3)) },
      { year: '2023', employees: Math.round(currentEmployees / Math.pow(1 + avgAnnualGrowth, 2)) },
      { year: '2024', employees: Math.round(currentEmployees / (1 + avgAnnualGrowth)) },
      { year: '2025', employees: currentEmployees },
    ];
  };

  const revenueData = generateRevenueData();
  const employeeData = generateEmployeeData();

  const hasGrowthData =
    company.growth_metrics &&
    (company.growth_metrics.revenue_growth_3yr ||
      company.growth_metrics.revenue_growth_5yr ||
      company.growth_metrics.employee_growth_rate);

  if (!hasGrowthData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Growth Trend */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`$${value}M`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
          {company.growth_metrics?.revenue_growth_5yr && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                5-Year Growth:{' '}
                <span className="font-semibold text-green-600">
                  {company.growth_metrics.revenue_growth_5yr}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Growth Trend */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Employee Growth Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={employeeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [value.toLocaleString(), 'Employees']}
              />
              <Line
                type="monotone"
                dataKey="employees"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {company.growth_metrics?.employee_growth_rate && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                Growth Rate:{' '}
                <span className="font-semibold text-blue-600">
                  {company.growth_metrics.employee_growth_rate}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
