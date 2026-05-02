import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Users,
  ArrowUpRight, ArrowDownRight, Building2, FileText, BarChart3,
  AlertTriangle, Target, Layers, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import FinanceKPICard from '@/components/finance/FinanceKPICard';
import CrossModuleSourcesPanel from '@/components/finance/CrossModuleSourcesPanel';
import SpendingDonut from '@/components/finance/SpendingDonut';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FinanceDashboard() {
  const { data: transactions = [], isLoading: txnLoading } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => base44.entities.FinanceTransaction.list('-date', 500),
  });
  const { data: budgets = [] } = useQuery({
    queryKey: ['finance-budgets'],
    queryFn: () => base44.entities.FinanceBudget.list(),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: () => base44.entities.Invoice.list('-issued_date', 100),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ['finance-payments'],
    queryFn: () => base44.entities.Payment.list('-paid_at', 100),
  });
  const { data: payroll = [] } = useQuery({
    queryKey: ['finance-payroll'],
    queryFn: () => base44.entities.HRISPayroll.list('-pay_date', 100),
  });
  const { data: deals = [] } = useQuery({
    queryKey: ['finance-deals-won'],
    queryFn: () => base44.entities.Deal.filter({ stage: 'won' }),
  });
  const { data: allDeals = [] } = useQuery({
    queryKey: ['finance-deals-all'],
    queryFn: () => base44.entities.Deal.list(),
  });
  const { data: forecasts = [] } = useQuery({
    queryKey: ['finance-forecasts'],
    queryFn: () => base44.entities.FinanceForecast.list('-fiscal_year', 1),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['finance-employees'],
    queryFn: () => base44.entities.HRISEmployee.filter({ status: 'active' }),
  });

  const currentYear = new Date().getFullYear();

  // ── Revenue ───────────────────────────────────────────────────────────────
  const txnRevenue = useMemo(() =>
    transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0),
    [transactions]);
  const paymentRevenue = useMemo(() =>
    payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0),
    [payments]);
  const revenue = txnRevenue + paymentRevenue;

  // ── Expenses ──────────────────────────────────────────────────────────────
  const expenses = useMemo(() =>
    transactions.filter(t => ['expense', 'other'].includes(t.type)).reduce((s, t) => s + Math.abs(t.amount || 0), 0),
    [transactions]);
  const payrollCost = useMemo(() =>
    payroll.filter(p => p.status === 'paid').reduce((s, p) => s + (p.gross_pay || 0), 0),
    [payroll]);
  const totalExpenses = expenses + payrollCost;
  const netIncome = revenue - totalExpenses;
  const margin = revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : '0.0';

  // ── AR ────────────────────────────────────────────────────────────────────
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const arTotal = invoices
    .filter(i => !['paid', 'cancelled'].includes(i.status))
    .reduce((s, i) => s + ((i.total_amount || 0) - (i.amount_paid || 0)), 0);

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const wonRevenue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const openPipeline = allDeals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);

  // ── Forecast comparison ───────────────────────────────────────────────────
  const latestForecast = forecasts[0];
  const revVsForecast = latestForecast
    ? ((revenue / (latestForecast.revenue_forecast || 1)) * 100).toFixed(0)
    : null;

  // ── Monthly chart ─────────────────────────────────────────────────────────
  const chartData = useMemo(() => MONTHS.map((m, mi) => {
    const rev = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === mi && t.type === 'revenue';
    }).reduce((s, t) => s + (t.amount || 0), 0)
    + payments.filter(p => {
      const d = new Date(p.paid_at);
      return d.getFullYear() === currentYear && d.getMonth() === mi && p.status === 'completed';
    }).reduce((s, p) => s + (p.amount || 0), 0);

    const exp = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === mi && ['expense', 'other'].includes(t.type);
    }).reduce((s, t) => s + Math.abs(t.amount || 0), 0);

    const pr = payroll.filter(p => {
      const d = new Date(p.pay_date);
      return d.getFullYear() === currentYear && d.getMonth() === mi && p.status === 'paid';
    }).reduce((s, p) => s + (p.gross_pay || 0), 0);

    // Forecast overlay
    const fMonthly = latestForecast?.monthly_breakdown?.find(mb => mb.month === m);
    return {
      month: m,
      Revenue: rev,
      Expenses: exp + pr,
      'Net Income': rev - exp - pr,
      'Rev Forecast': fMonthly?.revenue || null,
    };
  }), [transactions, payments, payroll, latestForecast, currentYear]);

  // ── Spending by category (donut) ──────────────────────────────────────────
  const spendingByCat = useMemo(() => {
    const map = {};
    transactions.filter(t => ['expense', 'other'].includes(t.type)).forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + Math.abs(t.amount || 0);
    });
    // add payroll as a category
    if (payrollCost > 0) map['Payroll'] = payrollCost;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [transactions, payrollCost]);

  // ── Dept spend ────────────────────────────────────────────────────────────
  const deptSpend = useMemo(() => {
    const map = {};
    transactions.filter(t => ['expense', 'other'].includes(t.type) && t.department).forEach(t => {
      map[t.department] = (map[t.department] || 0) + Math.abs(t.amount || 0);
    });
    return Object.entries(map).map(([dept, amount]) => ({ dept, Amount: amount })).sort((a, b) => b.Amount - a.Amount).slice(0, 6);
  }, [transactions]);

  // ── Active budgets ────────────────────────────────────────────────────────
  const activeBudgets = budgets.filter(b => ['active', 'approved'].includes(b.status));
  const recentTxns = transactions.slice(0, 8);

  // ── Source counts ─────────────────────────────────────────────────────────
  const sourceCounts = {
    'HRIS / Payroll': payroll.length,
    'Sales / CRM': deals.length,
    'Payments': payments.length,
    'Business Dev': allDeals.length,
    'Finance Ledger': transactions.length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600" />
            Finance Command Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consolidated financials — HRIS · Sales · Payments · CRM · Business Dev
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild><Link to="/FinancePL">P&L</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/FinanceBudgets">Budgets</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/FinanceForecast">Forecasts</Link></Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" asChild>
            <Link to="/FinanceTransactions">+ Transaction</Link>
          </Button>
        </div>
      </div>

      {/* Forecast vs Actuals banner */}
      {latestForecast && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
              Active Forecast: {latestForecast.name}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              Revenue: {fmt(revenue)} actual vs {fmt(latestForecast.revenue_forecast)} target
              {revVsForecast && <span className="ml-2 font-bold">({revVsForecast}% achieved)</span>}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-indigo-500">Forecast EBITDA</p>
              <p className="font-bold text-indigo-800 dark:text-indigo-300">{fmt(latestForecast.ebitda_forecast)}</p>
            </div>
            <div className="text-center">
              <p className="text-indigo-500">Actual Net Income</p>
              <p className={`font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(netIncome)}</p>
            </div>
            <Button variant="outline" size="sm" asChild className="border-indigo-300 text-indigo-700">
              <Link to="/FinanceForecast">View Forecasts</Link>
            </Button>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <FinanceKPICard label="Total Revenue" value={fmt(revenue)} trend={`${margin}% margin`} trendUp={netIncome >= 0} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle={`${fmt(txnRevenue)} ops + ${fmt(paymentRevenue)} payments`} />
        <FinanceKPICard label="Total Expenses" value={fmt(totalExpenses)} trend={`${fmt(payrollCost)} payroll`} trendUp={false} icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50" subtitle={`${fmt(expenses)} opex`} />
        <FinanceKPICard label="Net Income" value={fmt(netIncome)} trend={`${margin}% margin`} trendUp={netIncome >= 0} icon={DollarSign} iconColor={netIncome >= 0 ? 'text-blue-600' : 'text-red-600'} iconBg="bg-blue-50" />
        <FinanceKPICard label="Payroll Cost" value={fmt(payrollCost)} trend={`${employees.length} active employees`} trendUp={true} icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50" subtitle={`${payroll.filter(p=>p.status==='paid').length} paid runs`} />
        <FinanceKPICard label="Accounts Receivable" value={fmt(arTotal)} trend={overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue` : 'All current'} trendUp={overdueInvoices.length === 0} icon={CreditCard} iconColor={overdueInvoices.length ? 'text-orange-600' : 'text-teal-600'} iconBg="bg-orange-50" />
        <FinanceKPICard label="Open Pipeline" value={fmt(openPipeline)} trend={`${allDeals.filter(d => !['won','lost'].includes(d.stage)).length} active deals`} trendUp={true} icon={Target} iconColor="text-indigo-600" iconBg="bg-indigo-50" subtitle={`${fmt(wonRevenue)} closed won`} />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue vs Expenses trend */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue vs Expenses — FY{currentYear}</CardTitle>
              {latestForecast && <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">Forecast overlay</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExp)" />
                <Area type="monotone" dataKey="Net Income" stroke="#6366f1" strokeWidth={2} fill="none" strokeDasharray="0" />
                {latestForecast && (
                  <Area type="monotone" dataKey="Rev Forecast" stroke="#a855f7" strokeWidth={1.5} fill="none" strokeDasharray="5 3" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending by Category Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingDonut data={spendingByCat} />
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    ? Math.min(100, ((b.total_spent || 0) / b.total_budgeted) * 100) : 0;
                  const over = pct >= 90;
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{b.name}</span>
                        <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>{fmt(b.total_spent || 0)} spent</span>
                        <span>{fmt(b.total_budgeted)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Spend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spend by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {deptSpend.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No department data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptSpend} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="Amount" fill="#6366f1" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Data Sources Panel */}
        <CrossModuleSourcesPanel counts={sourceCounts} />
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
              <div className="space-y-0">
                {recentTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">{t.date} · <span className="capitalize">{t.category || t.type}</span> · <span className="uppercase text-xs">{t.source}</span></p>
                    </div>
                    <div className="ml-3 text-right">
                      <span className={`text-sm font-semibold block ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AR + Overdue Invoices */}
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
              <Button variant="ghost" size="sm" asChild><Link to="/Payments">Invoices</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* AR Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Total AR', value: fmt(arTotal), color: 'text-gray-900 dark:text-white' },
                { label: 'Overdue', value: fmt(overdueInvoices.reduce((s,i)=>s+(i.total_amount||0)-(i.amount_paid||0),0)), color: 'text-red-500' },
                { label: 'Collected', value: fmt(paymentRevenue), color: 'text-emerald-600' },
              ].map(k => (
                <div key={k.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{k.label}</p>
                  <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>
            {invoices.filter(i => !['paid','cancelled'].includes(i.status)).length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No open invoices</p>
              </div>
            ) : (
              <div className="space-y-0">
                {invoices.filter(i => !['paid','cancelled'].includes(i.status)).slice(0, 6).map((inv) => {
                  const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{inv.title || inv.invoice_number || 'Invoice'}</p>
                        <p className="text-xs text-gray-400">Due {inv.due_date || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge className={`text-xs border-0 ${inv.status === 'overdue' ? 'bg-red-100 text-red-700' : inv.status === 'partially_paid' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {inv.status?.replace('_', ' ')}
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