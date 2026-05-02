import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Users,
  ArrowUpRight, ArrowDownRight, Building2, FileText, BarChart3, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;

export default function FinanceDashboard() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => base44.entities.FinanceTransaction.list('-date', 200),
  });
  const { data: budgets = [] } = useQuery({
    queryKey: ['finance-budgets'],
    queryFn: () => base44.entities.FinanceBudget.list(),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: () => base44.entities.Invoice.list('-issued_date', 50),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ['finance-payments'],
    queryFn: () => base44.entities.Payment.list('-paid_at', 50),
  });
  const { data: payroll = [] } = useQuery({
    queryKey: ['finance-payroll'],
    queryFn: () => base44.entities.HRISPayroll.list('-pay_date', 50),
  });
  const { data: deals = [] } = useQuery({
    queryKey: ['finance-deals'],
    queryFn: () => base44.entities.Deal.filter({ stage: 'won' }),
  });

  // KPIs
  const revenue = useMemo(() =>
    transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0) +
    payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0),
    [transactions, payments]);

  const expenses = useMemo(() =>
    transactions.filter(t => ['expense', 'other'].includes(t.type)).reduce((s, t) => s + Math.abs(t.amount || 0), 0),
    [transactions]);

  const payrollCost = useMemo(() =>
    payroll.filter(p => p.status === 'paid').reduce((s, p) => s + (p.gross_pay || 0), 0),
    [payroll]);

  const totalExpenses = expenses + payrollCost;
  const netIncome = revenue - totalExpenses;
  const margin = revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : '0.0';

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const arTotal = invoices
    .filter(i => !['paid', 'cancelled'].includes(i.status))
    .reduce((s, i) => s + ((i.total_amount || 0) - (i.amount_paid || 0)), 0);

  const pipelineValue = deals.reduce((s, d) => s + (d.value || 0), 0);

  // Monthly chart data from transactions
  const chartData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, mi) => {
      const rev = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === mi && t.type === 'revenue';
      }).reduce((s, t) => s + (t.amount || 0), 0);
      const exp = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === mi && ['expense', 'other'].includes(t.type);
      }).reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      return { month: m, Revenue: rev || 0, Expenses: exp || 0, 'Net Income': (rev - exp) || 0 };
    });
  }, [transactions]);

  // Budget utilization
  const activeBudgets = budgets.filter(b => b.status === 'active' || b.status === 'approved');

  // Recent transactions
  const recentTxns = transactions.slice(0, 8);

  const kpis = [
    {
      label: 'Total Revenue',
      value: fmt(revenue),
      trend: '+12.4%',
      up: true,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Expenses',
      value: fmt(totalExpenses),
      trend: '+5.1%',
      up: false,
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Net Income',
      value: fmt(netIncome),
      trend: `${margin}% margin`,
      up: netIncome >= 0,
      icon: DollarSign,
      color: netIncome >= 0 ? 'text-blue-600' : 'text-red-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Payroll Cost',
      value: fmt(payrollCost),
      trend: `${payroll.filter(p=>p.status==='paid').length} paid runs`,
      up: true,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Accounts Receivable',
      value: fmt(arTotal),
      trend: `${overdueInvoices.length} overdue`,
      up: overdueInvoices.length === 0,
      icon: CreditCard,
      color: overdueInvoices.length ? 'text-orange-600' : 'text-teal-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Won Pipeline',
      value: fmt(pipelineValue),
      trend: `${deals.length} closed deals`,
      up: true,
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600" />
            Finance Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consolidated view across Sales, HRIS, Payments & Business Development
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild><Link to="/FinancePL">P&L Statement</Link></Button>
          <Button variant="outline" asChild><Link to="/FinanceBudgets">Budgets</Link></Button>
          <Button variant="outline" asChild><Link to="/FinanceTransactions">Transactions</Link></Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link to="/FinanceTransactions">+ Add Transaction</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{k.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{k.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-0.5 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {k.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue vs Expenses (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#colorExp)" />
                <Area type="monotone" dataKey="Net Income" stroke="#6366f1" strokeWidth={2} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Budget Utilization</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/FinanceBudgets">View all</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeBudgets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active budgets</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/FinanceBudgets">Create Budget</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBudgets.slice(0, 5).map((b) => {
                  const pct = b.total_budgeted > 0
                    ? Math.min(100, ((b.total_spent || 0) / b.total_budgeted) * 100)
                    : 0;
                  const over = pct >= 90;
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{b.name}</span>
                        <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>{fmt(b.total_spent || 0)} spent</span>
                        <span>{fmt(b.total_budgeted)} budget</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/FinanceTransactions">View all</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTxns.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">{t.date} · {t.category || t.type}</p>
                    </div>
                    <span className={`text-sm font-semibold ml-3 ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Invoices / AR */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Accounts Receivable
                {overdueInvoices.length > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {overdueInvoices.length} overdue
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/Payments">View Invoices</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No open invoices</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.filter(i => !['paid','cancelled'].includes(i.status)).slice(0, 8).map((inv) => {
                  const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{inv.title || inv.invoice_number}</p>
                        <p className="text-xs text-gray-400">Due {inv.due_date || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge className={`text-xs ${
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          inv.status === 'partially_paid' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {inv.status}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmt(outstanding)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}