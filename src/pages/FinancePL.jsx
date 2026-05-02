import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Download, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();

export default function FinancePL() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [view, setView] = useState('summary'); // summary | detailed | monthly

  const { data: transactions = [], isLoading } = useQuery({
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

  // Revenue lines
  const txnRevenue = filteredTxns.filter(t => t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0);
  const paymentRevenue = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalRevenue = txnRevenue + paymentRevenue;

  // Expense lines grouped by category
  const expenseTxns = filteredTxns.filter(t => ['expense', 'other'].includes(t.type));
  const expenseByCategory = expenseTxns.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount || 0);
    return acc;
  }, {});

  const totalPayroll = filteredPayroll.reduce((s, p) => s + (p.gross_pay || 0), 0);
  const totalOtherExpenses = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);
  const totalExpenses = totalOtherExpenses + totalPayroll;

  const grossProfit = totalRevenue - totalPayroll; // Revenue - COGS (payroll)
  const ebitda = totalRevenue - totalExpenses;
  const netIncome = ebitda; // simplified

  // Monthly P&L for chart
  const monthlyData = useMemo(() => MONTHS.map((m, mi) => {
    const rev = filteredTxns.filter(t => new Date(t.date).getMonth() === mi && t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0)
      + filteredPayments.filter(p => new Date(p.paid_at).getMonth() === mi).reduce((s, p) => s + (p.amount || 0), 0);
    const exp = filteredTxns.filter(t => new Date(t.date).getMonth() === mi && ['expense','other'].includes(t.type)).reduce((s, t) => s + Math.abs(t.amount || 0), 0);
    const pr = filteredPayroll.filter(p => new Date(p.pay_date).getMonth() === mi).reduce((s, p) => s + (p.gross_pay || 0), 0);
    return { month: m, Revenue: rev, Expenses: exp + pr, 'Net Income': rev - exp - pr };
  }), [filteredTxns, filteredPayments, filteredPayroll]);

  const plRows = [
    { label: 'Revenue', value: totalRevenue, type: 'header' },
    { label: '  Transaction Revenue', value: txnRevenue, type: 'item' },
    { label: '  Payment Revenue', value: paymentRevenue, type: 'item' },
    { label: 'Gross Revenue', value: totalRevenue, type: 'subtotal' },
    { label: '', value: null, type: 'spacer' },
    { label: 'Operating Expenses', value: totalExpenses, type: 'header' },
    { label: '  Payroll & Benefits', value: totalPayroll, type: 'item' },
    ...Object.entries(expenseByCategory).map(([cat, val]) => ({ label: `  ${cat}`, value: val, type: 'item' })),
    { label: 'Total Operating Expenses', value: totalExpenses, type: 'subtotal' },
    { label: '', value: null, type: 'spacer' },
    { label: 'EBITDA', value: ebitda, type: 'kpi', highlight: ebitda >= 0 ? 'green' : 'red' },
    { label: 'Net Income', value: netIncome, type: 'kpi', highlight: netIncome >= 0 ? 'green' : 'red' },
    { label: 'Net Margin', value: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) + '%' : '0%', type: 'kpi', highlight: netIncome >= 0 ? 'green' : 'red', isPercent: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Profit & Loss Statement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Income statement across all company sources</p>
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
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export</Button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), color: 'emerald', icon: TrendingUp },
          { label: 'Total Expenses', value: fmt(totalExpenses), color: 'red', icon: TrendingDown },
          { label: 'EBITDA', value: fmt(ebitda), color: ebitda >= 0 ? 'blue' : 'red', icon: DollarSign },
          { label: 'Net Margin', value: totalRevenue > 0 ? ((netIncome/totalRevenue)*100).toFixed(1)+'%' : '0%', color: netIncome >= 0 ? 'emerald' : 'red', icon: TrendingUp },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${k.color}-50 flex items-center justify-center`}>
                <k.icon className={`w-5 h-5 text-${k.color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {view === 'summary' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* P&L Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Income Statement — FY{year}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {plRows.map((row, i) => {
                  if (row.type === 'spacer') return <div key={i} className="h-3" />;
                  if (row.type === 'header') return (
                    <div key={i} className="pt-2 pb-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{row.label}</p>
                    </div>
                  );
                  if (row.type === 'subtotal') return (
                    <div key={i} className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                      <span className="text-gray-900 dark:text-white">{fmt(row.value)}</span>
                    </div>
                  );
                  if (row.type === 'kpi') return (
                    <div key={i} className={`flex justify-between py-2.5 px-3 rounded-lg mt-2 ${row.highlight === 'green' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <span className={`font-bold text-sm ${row.highlight === 'green' ? 'text-emerald-700' : 'text-red-600'}`}>{row.label}</span>
                      <span className={`font-bold text-sm ${row.highlight === 'green' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {row.isPercent ? row.value : fmt(row.value)}
                      </span>
                    </div>
                  );
                  return (
                    <div key={i} className="flex justify-between py-1.5 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                      <span className="text-gray-800 dark:text-gray-200">{fmt(row.value)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Bar chart */}
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
                  <Bar dataKey="Revenue" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Monthly detail table
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Breakdown — FY{year}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Expenses</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Net Income</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => {
                  const margin = row.Revenue > 0 ? ((row['Net Income'] / row.Revenue) * 100).toFixed(1) : '—';
                  return (
                    <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2.5 font-medium text-gray-700 dark:text-gray-300">{row.month}</td>
                      <td className="py-2.5 text-right text-emerald-600">{fmt(row.Revenue)}</td>
                      <td className="py-2.5 text-right text-red-500">{fmt(row.Expenses)}</td>
                      <td className={`py-2.5 text-right font-semibold ${row['Net Income'] >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(row['Net Income'])}</td>
                      <td className={`py-2.5 text-right text-xs ${row['Net Income'] >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{margin !== '—' ? margin + '%' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="py-2.5 text-gray-900 dark:text-white">Total</td>
                  <td className="py-2.5 text-right text-emerald-600">{fmt(totalRevenue)}</td>
                  <td className="py-2.5 text-right text-red-500">{fmt(totalExpenses)}</td>
                  <td className={`py-2.5 text-right ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(netIncome)}</td>
                  <td className={`py-2.5 text-right text-xs ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalRevenue > 0 ? ((netIncome/totalRevenue)*100).toFixed(1)+'%' : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}