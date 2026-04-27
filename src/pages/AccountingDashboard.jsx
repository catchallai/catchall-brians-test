import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, PieChart, FileText, Receipt } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AccountingDashboard() {
  // Sample data - would come from API
  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000 },
    { month: 'Feb', revenue: 52000, expenses: 31000, profit: 21000 },
    { month: 'Mar', revenue: 48000, expenses: 29000, profit: 19000 },
    { month: 'Apr', revenue: 61000, expenses: 35000, profit: 26000 },
    { month: 'May', revenue: 55000, expenses: 33000, profit: 22000 },
    { month: 'Jun', revenue: 67000, expenses: 38000, profit: 29000 },
  ];

  const expensesByCategory = [
    { name: 'Salaries', value: 120000, color: '#8b5cf6' },
    { name: 'Marketing', value: 45000, color: '#ec4899' },
    { name: 'Operations', value: 32000, color: '#14b8a6' },
    { name: 'Software', value: 18000, color: '#f59e0b' },
    { name: 'Other', value: 15000, color: '#6366f1' },
  ];

  const cashFlowData = [
    { month: 'Jan', inflow: 52000, outflow: 41000 },
    { month: 'Feb', inflow: 58000, outflow: 45000 },
    { month: 'Mar', inflow: 54000, outflow: 43000 },
    { month: 'Apr', inflow: 67000, outflow: 49000 },
    { month: 'May', inflow: 61000, outflow: 47000 },
    { month: 'Jun', inflow: 72000, outflow: 51000 },
  ];

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            Accounting Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Financial overview and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Receipt className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 mt-1">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 mt-1">+8.3% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Net Profit</p>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalProfit.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 mt-1">+18.2% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Profit Margin</p>
              <PieChart className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{profitMargin}%</p>
            <p className="text-xs text-emerald-600 mt-1">+2.1% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="inflow" fill="#10b981" />
              <Bar dataKey="outflow" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                date: '2025-01-08',
                description: 'Client Payment - ABC Corp',
                amount: 15000,
                type: 'income',
              },
              { date: '2025-01-07', description: 'Office Rent', amount: -3500, type: 'expense' },
              {
                date: '2025-01-06',
                description: 'Software Subscription',
                amount: -299,
                type: 'expense',
              },
              {
                date: '2025-01-05',
                description: 'Client Payment - XYZ Ltd',
                amount: 8500,
                type: 'income',
              },
              {
                date: '2025-01-04',
                description: 'Marketing Campaign',
                amount: -2100,
                type: 'expense',
              },
            ].map((transaction, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500">{transaction.date}</p>
                </div>
                <Badge
                  className={`${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border`}
                >
                  {transaction.type === 'income' ? '+' : ''}
                  {transaction.amount < 0 ? transaction.amount : `+${transaction.amount}`}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
