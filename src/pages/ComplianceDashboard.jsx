import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck, FileText, GraduationCap, AlertTriangle, Search, TrendingUp, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4'];

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {to && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
  return to ? <Link to={createPageUrl(to)}>{content}</Link> : content;
}

export default function ComplianceDashboard() {
  const { data: policies = [] } = useQuery({ queryKey: ['comp-policies'], queryFn: () => base44.entities.CompliancePolicy.list() });
  const { data: trainings = [] } = useQuery({ queryKey: ['comp-trainings'], queryFn: () => base44.entities.ComplianceTraining.list() });
  const { data: incidents = [] } = useQuery({ queryKey: ['comp-incidents'], queryFn: () => base44.entities.ComplianceIncident.list() });
  const { data: audits = [] } = useQuery({ queryKey: ['comp-audits'], queryFn: () => base44.entities.ComplianceAudit.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['comp-risks'], queryFn: () => base44.entities.ComplianceRisk.list() });

  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'under_investigation');
  const activePolicies = policies.filter(p => p.status === 'active');
  const overdueTrainings = trainings.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status === 'active');
  const highRisks = risks.filter(r => r.status !== 'closed' && (r.likelihood === 'likely' || r.likelihood === 'almost_certain'));

  const incidentsByCategory = Object.entries(
    incidents.reduce((acc, i) => { acc[i.category || 'other'] = (acc[i.category || 'other'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const riskBySeverity = Object.entries(
    risks.reduce((acc, r) => { const k = r.impact || 'unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name, count }));

  const auditsByStatus = Object.entries(
    audits.reduce((acc, a) => { acc[a.status || 'planned'] = (acc[a.status || 'planned'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" /> Corporate Compliance
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage policies, training, incidents, audits, and risk across the organization</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Active Policies" value={activePolicies.length} icon={FileText} color="bg-emerald-500" to="CompliancePolicies" />
        <StatCard label="Open Incidents" value={openIncidents.length} sub="needs attention" icon={AlertTriangle} color={openIncidents.length > 0 ? 'bg-red-500' : 'bg-gray-400'} to="ComplianceIncidents" />
        <StatCard label="Active Trainings" value={trainings.filter(t => t.status === 'active').length} sub={`${overdueTrainings.length} overdue`} icon={GraduationCap} color="bg-blue-500" to="ComplianceTraining" />
        <StatCard label="Audits" value={audits.length} sub={`${audits.filter(a => a.status === 'in_progress').length} in progress`} icon={Search} color="bg-violet-500" to="ComplianceAudits" />
        <StatCard label="High Risks" value={highRisks.length} sub="likely or certain" icon={TrendingUp} color={highRisks.length > 0 ? 'bg-orange-500' : 'bg-gray-400'} to="ComplianceRisk" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Incidents by Category</CardTitle></CardHeader>
          <CardContent>
            {incidentsByCategory.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No incidents yet.</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={incidentsByCategory} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name }) => name} labelLine={false}>
                    {incidentsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Risk by Impact</CardTitle></CardHeader>
          <CardContent>
            {riskBySeverity.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No risks logged.</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskBySeverity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Audit Status</CardTitle></CardHeader>
          <CardContent>
            {auditsByStatus.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No audits scheduled.</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={auditsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name }) => name} labelLine={false}>
                    {auditsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      {openIncidents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Open Incidents Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openIncidents.slice(0, 5).map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{inc.title}</p>
                    <p className="text-xs text-gray-500">{inc.category?.replace(/_/g, ' ')} · {inc.severity}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inc.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inc.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}