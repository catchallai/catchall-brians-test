import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDec = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();

export default function FinancePL() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [view, setView] = useState('summary');

  const { data: transactions = [] } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => base44.entities.FinanceTransaction.list('-date', 500),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ['finance-payments'],
    queryFn: () => base44.entities.Payment.list('-paid_at', 200),
  });
  const { data: payroll = [] } = useQuery({
    queryKey: ['finance-payroll'],
    queryFn: () => base44.entities.HRISPayroll.list('-pay_date', 200),
  });
  const { data: deals = [] } = useQuery({
    queryKey: ['finance-deals-won'],
    queryFn: () => base44.entities.Deal.filter({ stage: 'won' }),
  });
  const { data: forecasts = [] } = useQuery({
    queryKey: ['finance-forecasts'],
    queryFn: () => base44.entities.FinanceForecast.list('-fiscal_year', 5),
  });

  const yearNum = parseInt(year);

  const filteredTxns = useMemo(() =>
    transactions.filter(t => new Date(t.date).getFullYear() === yearNum),
    [transactions, yearNum]);
  const filteredPayments = useMemo(() =>
    payments.filter(p => p.status === 'completed' && new Date(p.paid_at).getFullYear() === yearNum),
    [payments, yearNum]);
  const filteredPayroll = useMemo(() =>
    payroll.filter(p => p.status === 'paid' && new Date(p.pay_date).getFullYear() === yearNum),
    [payroll, yearNum]);
  const yearForecast = useMemo(() =>
    forecasts.find(f => f.fiscal_year === yearNum && f.period === 'annual'),
    [forecasts, yearNum]);

  // Revenue
  const txnRevenue = filteredTxns.filter(t => t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0);
  const paymentRevenue = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const dealRevenue = deals.filter(d => new Date(d.updated_date).getFullYear() === yearNum).reduce((s, d) => s + (d.value || 0), 0);
  const totalRevenue = txnRevenue + paymentRevenue;

  // COGS (payroll as primary cost)
  const totalPayroll = filteredPayroll.reduce((s, p) => s + (p.gross_pay || 0), 0);
  const grossProfit = totalRevenue - totalPayroll;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  // OpEx by category
  const expenseTxns = filteredTxns.filter(t => ['expense', 'other'].includes(t.type));
  const expenseByCategory = expenseTxns.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount || 0);
    return acc;
  }, {});
  const totalOpEx = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);
  const totalExpenses = totalOpEx + totalPayroll;
  const ebitda = totalRevenue - totalExpenses;
  const netIncome = ebitda;
  const netMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0';

  // Variance vs forecast
  const revVariance = yearForecast ? totalRevenue - yearForecast.revenue_forecast : null;
  const expVariance = yearForecast ? totalExpenses - (yearForecast.expense_forecast + yearForecast.payroll_forecast) : null;

  // Department breakdown
  const deptRevenue = filteredTxns.filter(t => t.type === 'revenue' && t.department).reduce((acc, t) => {
    acc[t.department] = (acc[t.department] || 0) + (t.amount || 0);
    return acc;
  }, {});

  // Monthly data
  const monthlyData = useMemo(() => MONTHS.map((m, mi) => {
    const rev = filteredTxns.filter(t => new Date(t.date).getMonth() === mi && t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0)
      + filteredPayments.filter(p => new Date(p.paid_at).getMonth() === mi).reduce((s, p) => s + (p.amount || 0), 0);
    const exp = filteredTxns.filter(t => new Date(t.date).getMonth() === mi && ['expense','other'].includes(t.type)).reduce((s, t) => s + Math.abs(t.amount || 0), 0);
    const pr = filteredPayroll.filter(p => new Date(p.pay_date).getMonth() === mi).reduce((s, p) => s + (p.gross_pay || 0), 0);
    const fMonthly = yearForecast?.monthly_breakdown?.find(mb => mb.month === m);
    return {
      month: m,
      Revenue: rev,
      'Gross Profit': rev - pr,
      OpEx: exp,
      Payroll: pr,
      'Net Income': rev - exp - pr,
      'Forecast Rev': fMonthly?.revenue || null,
    };
  }), [filteredTxns, filteredPayments, filteredPayroll, yearForecast]);

  const plRows = [
    { label: 'REVENUE', type: 'section' },
    { label: 'Transaction Revenue', value: txnRevenue, type: 'item', indent: 1 },
    { label: 'Payment Revenue', value: paymentRevenue, type: 'item', indent: 1 },
    { label: 'Total Revenue', value: totalRevenue, type: 'subtotal' },
    { type: 'spacer' },
    { label: 'COST OF GOODS SOLD', type: 'section' },
    { label: 'Payroll & Benefits', value: totalPayroll, type: 'item', indent: 1 },
    { label: 'Total COGS', value: totalPayroll, type: 'subtotal' },
    { label: 'Gross Profit', value: grossProfit, type: 'kpi', highlight: grossProfit >= 0 ? 'green' : 'red', suffix: `(${grossMargin}% margin)` },
    { type: 'spacer' },
    { label: 'OPERATING EXPENSES', type: 'section' },
    ...Object.entries(expenseByCategory).sort((a,b)=>b[1]-a[1]).map(([cat, val]) => ({ label: cat, value: val, type: 'item', indent: 1 })),
    { label: 'Total OpEx', value: totalOpEx, type: 'subtotal' },
    { type: 'spacer' },
    { label: 'EBITDA', value: ebitda, type: 'kpi', highlight: ebitda >= 0 ? 'green' : 'red' },
    { label: 'Net Income', value: netIncome, type: 'kpi', highlight: netIncome >= 0 ? 'green' : 'red' },
    { label: 'Net Margin', value: `${netMargin}%`, type: 'kpi', highlight: netIncome >= 0 ? 'green' : 'red', isStr: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Profit & Loss Statement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consolidated income statement — all data sources</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR, CURRENT_YEAR-1, CURRENT_YEAR-2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="dept">By Department</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export</Button>
        </div>
      </div>

      {/* Forecast Variance Banner */}
      {yearForecast && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <div className="text-center">
            <p className="text-xs text-indigo-500 mb-0.5">Forecast: {yearForecast.name}</p>
            <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">vs Actuals</p>
          </div>
          {[
            { label: 'Revenue Variance', value: revVariance, fmt: true },
            { label: 'Expense Variance', value: expVariance, fmt: true, invertColor: true },
            { label: 'Forecast EBITDA', value: yearForecast.ebitda_forecast, fmt: true, neutral: true },
          ].map(k => (
            <div key={k.label} className="text-center">
              <p className="text-xs text-indigo-400 mb-0.5">{k.label}</p>
              <p className={`text-sm font-bold ${k.neutral ? 'text-indigo-700' : k.invertColor ? (k.value < 0 ? 'text-emerald-600' : 'text-red-500') : (k.value >= 0 ? 'text-emerald-600' : 'text-red-500')}`}>
                {k.fmt ? (k.value >= 0 ? '+' : '') + fmt(k.value) : k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmtDec(totalRevenue), icon: TrendingUp, color: 'emerald' },
          { label: 'Gross Profit', value: fmtDec(grossProfit), sub: `${grossMargin}% gross margin`, icon: DollarSign, color: grossProfit >= 0 ? 'blue' : 'red' },
          { label: 'EBITDA', value: fmtDec(ebitda), icon: DollarSign, color: ebitda >= 0 ? 'blue' : 'red' },
          { label: 'Net Margin', value: `${netMargin}%`, sub: fmtDec(netIncome) + ' net income', icon: TrendingUp, color: netIncome >= 0 ? 'emerald' : 'red' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              {k.sub && <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {view === 'summary' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* P&L Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Income Statement — FY{year}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                {plRows.map((row, i) => {
                  if (row.type === 'spacer') return <div key={i} className="h-3" />;
                  if (row.type === 'section') return (
                    <div key={i} className="pt-3 pb-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{row.label}</p>
                    </div>
                  );
                  if (row.type === 'subtotal') return (
                    <div key={i} className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm mt-1">
                      <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                      <span className="text-gray-900 dark:text-white">{fmt(row.value)}</span>
                    </div>
                  );
                  if (row.type === 'kpi') return (
                    <div key={i} className={`flex justify-between py-2.5 px-3 rounded-lg mt-2 ${row.highlight === 'green' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <span className={`font-bold text-sm ${row.highlight === 'green' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                        {row.label} {row.suffix && <span className="font-normal text-xs opacity-70">{row.suffix}</span>}
                      </span>
                      <span className={`font-bold text-sm ${row.highlight === 'green' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                        {row.isStr ? row.value : fmt(row.value)}
                      </span>
                    </div>
                  );
                  return (
                    <div key={i} className={`flex justify-between py-1.5 text-sm ${row.indent === 1 ? 'pl-4' : ''}`}>
                      <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                      <span className="text-gray-800 dark:text-gray-200">{fmt(row.value)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={monthlyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#10b981" radius={[3,3,0,0]} stackId={undefined} />
                  <Bar dataKey="Payroll" fill="#7c3aed" radius={[0,0,0,0]} stackId="exp" />
                  <Bar dataKey="OpEx" fill="#ef4444" radius={[3,3,0,0]} stackId="exp" />
                  {yearForecast && <Line type="monotone" dataKey="Forecast Rev" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 3" />}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'monthly' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Breakdown — FY{year}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {['Month','Revenue','COGS (Payroll)','Gross Profit','OpEx','Net Income','Margin'].map(h => (
                    <th key={h} className="text-right first:text-left py-2 px-2 text-gray-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => {
                  const gp = row.Revenue - row.Payroll;
                  const marginPct = row.Revenue > 0 ? ((row['Net Income'] / row.Revenue) * 100).toFixed(1) : '—';
                  return (
                    <tr key={row.month} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2.5 px-2 font-medium text-gray-700 dark:text-gray-300">{row.month}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-600">{fmt(row.Revenue)}</td>
                      <td className="py-2.5 px-2 text-right text-violet-600">{fmt(row.Payroll)}</td>
                      <td className={`py-2.5 px-2 text-right font-medium ${gp >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{fmt(gp)}</td>
                      <td className="py-2.5 px-2 text-right text-red-400">{fmt(row.OpEx)}</td>
                      <td className={`py-2.5 px-2 text-right font-semibold ${row['Net Income'] >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(row['Net Income'])}</td>
                      <td className={`py-2.5 px-2 text-right text-xs ${row['Net Income'] >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{marginPct !== '—' ? marginPct + '%' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <tr>
                  <td className="py-2.5 px-2 text-gray-900 dark:text-white">Total</td>
                  <td className="py-2.5 px-2 text-right text-emerald-600">{fmt(totalRevenue)}</td>
                  <td className="py-2.5 px-2 text-right text-violet-600">{fmt(totalPayroll)}</td>
                  <td className={`py-2.5 px-2 text-right ${grossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(grossProfit)}</td>
                  <td className="py-2.5 px-2 text-right text-red-400">{fmt(totalOpEx)}</td>
                  <td className={`py-2.5 px-2 text-right ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(netIncome)}</td>
                  <td className={`py-2.5 px-2 text-right text-xs ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{netMargin}%</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {view === 'dept' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Department</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(deptRevenue).length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No department-tagged revenue transactions</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(deptRevenue).sort((a,b)=>b[1]-a[1]).map(([dept, val]) => {
                    const pct = totalRevenue > 0 ? (val / totalRevenue * 100).toFixed(0) : 0;
                    return (
                      <div key={dept}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{dept}</span>
                          <span className="text-gray-500">{fmt(val)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Expense Categories</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(expenseByCategory).length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No expense categories found</p>
              ) : (
                <div className="space-y-3">
                  {[['Payroll & Benefits', totalPayroll], ...Object.entries(expenseByCategory).sort((a,b)=>b[1]-a[1])].map(([cat, val]) => {
                    const pct = totalExpenses > 0 ? (val / totalExpenses * 100).toFixed(0) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{cat}</span>
                          <span className="text-gray-500">{fmt(val)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}