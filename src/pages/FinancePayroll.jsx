import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, DollarSign, TrendingUp, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
    queryFn: () => base44.entities.HRISPayroll.list('-pay_date', 300),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['finance-employees-active'],
    queryFn: () => base44.entities.HRISEmployee.filter({ status: 'active' }),
  });

  const currentYear = new Date().getFullYear();

  const departments = useMemo(() =>
    ['all', ...new Set(payroll.map(p => p.department).filter(Boolean))], [payroll]);

  const filtered = useMemo(() => payroll.filter(p => {
    const matchSearch = !search || p.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchDept = filterDept === 'all' || p.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  }), [payroll, search, filterStatus, filterDept]);

  const paidRecords = useMemo(() => payroll.filter(p => p.status === 'paid'), [payroll]);
  const totalGross = paidRecords.reduce((s, p) => s + (p.gross_pay || 0), 0);
  const totalNet = paidRecords.reduce((s, p) => s + (p.net_pay || 0), 0);
  const totalTax = paidRecords.reduce((s, p) => s + ((p.federal_tax || 0) + (p.state_tax || 0) + (p.social_security || 0) + (p.medicare || 0)), 0);
  const totalBonus = paidRecords.reduce((s, p) => s + (p.bonus || 0), 0);
  const totalDeductions = paidRecords.reduce((s, p) => s + (p.total_deductions || 0), 0);

  // Cost per employee (avg)
  const uniqueEmployees = new Set(paidRecords.map(p => p.employee_name).filter(Boolean)).size;
  const avgCostPerEmployee = uniqueEmployees > 0 ? totalGross / uniqueEmployees : 0;

  // Monthly payroll trend
  const monthlyTrend = useMemo(() => MONTHS.map((m, mi) => {
    const monthPaid = payroll.filter(p => {
      if (p.status !== 'paid') return false;
      const d = new Date(p.pay_date);
      return d.getFullYear() === currentYear && d.getMonth() === mi;
    });
    return {
      month: m,
      'Gross Pay': monthPaid.reduce((s, p) => s + (p.gross_pay || 0), 0),
      'Net Pay': monthPaid.reduce((s, p) => s + (p.net_pay || 0), 0),
      'Bonuses': monthPaid.reduce((s, p) => s + (p.bonus || 0), 0),
    };
  }), [payroll, currentYear]);

  // Department breakdown
  const deptData = useMemo(() => {
    const map = {};
    paidRecords.forEach(p => {
      const dept = p.department || 'Unassigned';
      if (!map[dept]) map[dept] = { dept, 'Gross Pay': 0, 'Net Pay': 0, headcount: new Set() };
      map[dept]['Gross Pay'] += (p.gross_pay || 0);
      map[dept]['Net Pay'] += (p.net_pay || 0);
      if (p.employee_name) map[dept].headcount.add(p.employee_name);
    });
    return Object.values(map)
      .map(r => ({ ...r, headcount: r.headcount.size }))
      .sort((a, b) => b['Gross Pay'] - a['Gross Pay']);
  }, [paidRecords]);

  // Pay type breakdown
  const payTypeData = [
    { name: 'Base Salary', value: totalGross - totalBonus, fill: '#7c3aed' },
    { name: 'Bonuses', value: totalBonus, fill: '#10b981' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            Payroll & Compensation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Payroll costs synced from HRIS — {employees.length} active employees
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/HRISPayroll"><ExternalLink className="w-4 h-4 mr-2" />Manage in HRIS</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Gross Pay', value: fmt(totalGross), color: 'text-violet-600' },
          { label: 'Total Net Pay', value: fmt(totalNet), color: 'text-blue-600' },
          { label: 'Tax Withheld', value: fmt(totalTax), color: 'text-orange-600' },
          { label: 'Total Bonuses', value: fmt(totalBonus), color: 'text-emerald-600' },
          { label: 'Total Deductions', value: fmt(totalDeductions), color: 'text-red-500' },
          { label: 'Avg Cost / Employee', value: fmt(avgCostPerEmployee), color: 'text-indigo-600', sub: `${uniqueEmployees} employees` },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              {k.sub && <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Payroll Trend — FY{currentYear}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="Gross Pay" stroke="#7c3aed" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Net Pay" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Bonuses" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dept breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Gross Pay by Department</CardTitle></CardHeader>
          <CardContent>
            {deptData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No department data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Gross Pay" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Net Pay" fill="#a78bfa" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dept table */}
      {deptData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Department Cost Summary</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Department','Headcount','Gross Pay','Net Pay','Avg / Employee'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {deptData.map(d => (
                  <tr key={d.dept} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{d.dept}</td>
                    <td className="px-4 py-3 text-gray-500">{d.headcount}</td>
                    <td className="px-4 py-3 font-semibold text-violet-600">{fmt(d['Gross Pay'])}</td>
                    <td className="px-4 py-3 text-blue-600">{fmt(d['Net Pay'])}</td>
                    <td className="px-4 py-3 text-gray-600">{d.headcount > 0 ? fmt(d['Gross Pay'] / d.headcount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Filters + Detail table */}
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
        <p className="text-sm text-gray-400 self-center">{filtered.length} payroll records</p>
      </div>

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
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No payroll records. Manage payroll in HRIS.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.employee_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{p.pay_period_start} → {p.pay_period_end}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-violet-600">{fmt(p.gross_pay)}</td>
                    <td className="px-4 py-3 text-red-400">{fmt(p.total_deductions)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(p.net_pay)}</td>
                    <td className="px-4 py-3 text-blue-500">{p.bonus ? fmt(p.bonus) : '—'}</td>
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