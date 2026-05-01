import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, TrendingUp, Clock, Award, BarChart3, UserCheck } from 'lucide-react';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({ label, value, icon: Icon, color = 'text-violet-600', sub }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function HRISAnalytics() {
  const { data: employees = [] } = useQuery({ queryKey: ['hris-emp-analytics'], queryFn: () => base44.entities.HRISEmployee.list() });
  const { data: timeOff = [] } = useQuery({ queryKey: ['hris-to-analytics'], queryFn: () => base44.entities.HRISTimeOffRequest.list() });
  const { data: reviews = [] } = useQuery({ queryKey: ['hris-rv-analytics'], queryFn: () => base44.entities.HRISPerformanceReview.list() });
  const { data: trainings = [] } = useQuery({ queryKey: ['hris-tr-analytics'], queryFn: () => base44.entities.TalentTraining.list() });
  const { data: recognitions = [] } = useQuery({ queryKey: ['hris-rec-analytics'], queryFn: () => base44.entities.HRISRecognition.list() });

  const active = employees.filter((e) => e.status === 'active');
  const onboarding = employees.filter((e) => e.status === 'onboarding');
  const onLeave = employees.filter((e) => e.status === 'on_leave');

  // Headcount by department
  const byDept = Object.entries(
    active.reduce((acc, e) => { acc[e.department || 'Unknown'] = (acc[e.department || 'Unknown'] || 0) + 1; return acc; }, {})
  ).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count);

  // Employment type breakdown
  const byType = Object.entries(
    employees.reduce((acc, e) => { acc[e.employment_type || 'unknown'] = (acc[e.employment_type || 'unknown'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Time off by type
  const toByType = Object.entries(
    timeOff.reduce((acc, t) => { acc[t.type || 'other'] = (acc[t.type || 'other'] || 0) + (t.days_requested || 1); return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Recognition by category
  const recByCat = Object.entries(
    recognitions.reduce((acc, r) => { acc[r.category || 'other'] = (acc[r.category || 'other'] || 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name: name.replace(/_/g, ' '), count })).sort((a, b) => b.count - a.count);

  // Tenure buckets
  const today = new Date();
  const tenureBuckets = { '<1yr': 0, '1–2yr': 0, '2–5yr': 0, '5+yr': 0 };
  active.forEach((e) => {
    if (!e.start_date) return;
    const years = (today - new Date(e.start_date)) / (1000 * 60 * 60 * 24 * 365);
    if (years < 1) tenureBuckets['<1yr']++;
    else if (years < 2) tenureBuckets['1–2yr']++;
    else if (years < 5) tenureBuckets['2–5yr']++;
    else tenureBuckets['5+yr']++;
  });
  const tenureData = Object.entries(tenureBuckets).map(([name, count]) => ({ name, count }));

  const avgRating = reviews.filter(r => r.overall_rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviews.filter(r => r.overall_rating).length).toFixed(1)
    : '—';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-violet-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Data-driven insights across your workforce</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Employees" value={employees.length} icon={Users} />
        <StatCard label="Active" value={active.length} icon={UserCheck} color="text-green-600" />
        <StatCard label="Onboarding" value={onboarding.length} icon={TrendingUp} color="text-blue-600" />
        <StatCard label="On Leave" value={onLeave.length} icon={Clock} color="text-orange-600" />
        <StatCard label="Avg Performance" value={avgRating} icon={Award} color="text-yellow-600" sub="out of 5" />
        <StatCard label="Active Trainings" value={trainings.filter(t => t.status === 'active').length} icon={BarChart3} color="text-teal-600" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Headcount by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDept} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Employment Type Breakdown</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tenure Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tenureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Time Off by Type (days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={toByType} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name} labelLine={false}>
                  {toByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recognition by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={recByCat} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}