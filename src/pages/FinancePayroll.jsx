import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, DollarSign, TrendingUp, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

export default function FinancePayroll() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');

  const { data: payroll = [], isLoading } = useQuery({
    queryKey: ['finance-payroll-all'],
    queryFn: () => base44.entities.HRISPayroll.list('-pay_date', 200),
  });

  const departments = useMemo(() => ['all', ...new Set(payroll.map(p => p.department).filter(Boolean))], [payroll]);

  const filtered = useMemo(() => payroll.filter(p => {
    const matchSearch = !search || p.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchDept = filterDept === 'all' || p.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  }), [payroll, search, filterStatus, filterDept]);

  const paidRecords = payroll.filter(p => p.status === 'paid');
  const totalGross = paidRecords.reduce((s, p) => s + (p.gross_pay || 0), 0);
  const totalNet = paidRecords.reduce((s, p) => s + (p.net_pay || 0), 0);
  const totalTax = paidRecords.reduce((s, p) => s + ((p.federal_tax || 0) + (p.state_tax || 0) + (p.social_security || 0) + (p.medicare || 0)), 0);
  const totalBonus = paidRecords.reduce((s, p) => s + (p.bonus || 0), 0);

  // Department breakdown chart
  const deptData = useMemo(() => {
    const map = {};
    paidRecords.forEach(p => {
      const dept = p.department || 'Unassigned';
      map[dept] = (map[dept] || 0) + (p.gross_pay || 0);
    });
    return Object.entries(map).map(([dept, total]) => ({ dept, Total: total }));
  }, [paidRecords]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            Payroll Financials
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Payroll costs synced from HRIS</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/HRISPayroll"><LinkIcon className="w-4 h-4 mr-2" />Manage in HRIS</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Gross Pay', value: fmt(totalGross), color: 'violet' },
          { label: 'Total Net Pay', value: fmt(totalNet), color: 'blue' },
          { label: 'Total Tax Withheld', value: fmt(totalTax), color: 'orange' },
          { label: 'Total Bonuses', value: fmt(totalBonus), color: 'emerald' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {deptData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Gross Pay by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="Total" fill="#7c3aed" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by employee..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            {departments.map(d => <SelectItem key={d} value={d}>{d === 'all' ? 'All Depts' : d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Employee','Department','Pay Period','Gross Pay','Deductions','Net Pay','Bonus','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading payroll data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  No payroll records found. Manage payroll in HRIS.
                </td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.employee_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.pay_period_start} → {p.pay_period_end}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{fmt(p.gross_pay)}</td>
                    <td className="px-4 py-3 text-red-500">{fmt(p.total_deductions)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(p.net_pay)}</td>
                    <td className="px-4 py-3 text-violet-600">{p.bonus ? fmt(p.bonus) : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${STATUS_COLORS[p.status]} border-0 text-xs`}>{p.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}