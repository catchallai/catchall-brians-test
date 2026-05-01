import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, AlertTriangle, Search, TrendingUp, FileText,
  GraduationCap, CheckCircle2, Clock, XCircle, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, Cell, Legend
} from 'recharts';
import { useMemo } from 'react';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────
const RISK_SCORE_MAP = { low: 20, medium: 50, high: 75, critical: 95 };
const SEVERITY_SCORE = { minor: 10, low: 10, moderate: 30, medium: 30, high: 60, major: 60, critical: 100 };

function getRiskColor(score) {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 30) return '#eab308';
  return '#22c55e';
}

function getRiskLabel(score) {
  if (score >= 75) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
  if (score >= 50) return { label: 'High', color: 'bg-orange-100 text-orange-700' };
  if (score >= 30) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', color: 'bg-green-100 text-green-700' };
}

function ScoreGauge({ score, label, size = 120 }) {
  const color = getRiskColor(score);
  const { label: riskLabel, color: badgeColor } = getRiskLabel(score);
  const data = [{ value: score, fill: color }, { value: 100 - score, fill: '#f1f5f9' }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="100%"
            startAngle={180} endAngle={0}
            data={[{ value: score, fill: color }]}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" angleAxisId={0} cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{label}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${badgeColor}`}>{riskLabel}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconColor, trend }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-red-100 text-red-600' : trend < 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
              {trend > 0 ? `+${trend}` : trend} vs last mo.
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{value}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ComplianceExecutiveSummary() {
  const { data: incidents = [] } = useQuery({ queryKey: ['comp-incidents'], queryFn: () => base44.entities.ComplianceIncident.list() });
  const { data: audits = [] } = useQuery({ queryKey: ['comp-audits'], queryFn: () => base44.entities.ComplianceAudit.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['comp-risks'], queryFn: () => base44.entities.ComplianceRisk.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['comp-policies'], queryFn: () => base44.entities.CompliancePolicy.list() });
  const { data: trainings = [] } = useQuery({ queryKey: ['comp-trainings'], queryFn: () => base44.entities.ComplianceTraining.list() });
  const { data: violations = [] } = useQuery({ queryKey: ['ec-violations'], queryFn: () => base44.entities.ExportViolation.list() });

  // ── Risk Scores ─────────────────────────────────────────────────
  const overallRiskScore = useMemo(() => {
    const openIncidentScore = incidents
      .filter(i => i.status === 'open' || i.status === 'under_investigation')
      .reduce((acc, i) => acc + (SEVERITY_SCORE[i.severity] || 0), 0);

    const activeRiskScore = risks
      .filter(r => r.status !== 'closed')
      .reduce((acc, r) => acc + (RISK_SCORE_MAP[r.impact] || 0), 0);

    const openViolationScore = violations
      .filter(v => v.status === 'open' || v.status === 'under_investigation')
      .reduce((acc, v) => acc + (SEVERITY_SCORE[v.severity] || 0), 0);

    const raw = (openIncidentScore * 0.4 + activeRiskScore * 0.4 + openViolationScore * 0.2);
    return Math.min(100, Math.round(raw / Math.max(1, incidents.length + risks.length + violations.length) * 10));
  }, [incidents, risks, violations]);

  const policyRiskScore = useMemo(() => {
    const overdue = policies.filter(p => p.review_date && new Date(p.review_date) < new Date() && p.status === 'active').length;
    return Math.min(100, Math.round((overdue / Math.max(1, policies.length)) * 100));
  }, [policies]);

  const trainingRiskScore = useMemo(() => {
    const overdue = trainings.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status === 'active').length;
    return Math.min(100, Math.round((overdue / Math.max(1, trainings.length)) * 100));
  }, [trainings]);

  const auditRiskScore = useMemo(() => {
    const pending = audits.filter(a => a.status === 'planned' || a.status === 'in_progress').length;
    return Math.min(100, Math.round((pending / Math.max(1, audits.length)) * 100));
  }, [audits]);

  // ── Incident Trend (last 6 months) ──────────────────────────────
  const incidentTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, 'MMM'), start: startOfMonth(d), end: endOfMonth(d) };
    });

    return months.map(({ month, start, end }) => {
      const opened = incidents.filter(i => {
        try { return isWithinInterval(parseISO(i.incident_date || i.created_date), { start, end }); } catch { return false; }
      }).length;
      const resolved = incidents.filter(i => {
        try { return i.resolution_date && isWithinInterval(parseISO(i.resolution_date), { start, end }); } catch { return false; }
      }).length;
      return { month, opened, resolved };
    });
  }, [incidents]);

  // ── Pending Audit Actions ────────────────────────────────────────
  const pendingAudits = audits
    .filter(a => a.status === 'planned' || a.status === 'in_progress')
    .slice(0, 5);

  // ── Risk Distribution ────────────────────────────────────────────
  const riskDistribution = useMemo(() => {
    const counts = risks.filter(r => r.status !== 'closed').reduce((acc, r) => {
      const impact = r.impact || 'moderate';
      acc[impact] = (acc[impact] || 0) + 1;
      return acc;
    }, {});
    const order = ['negligible', 'minor', 'moderate', 'major', 'catastrophic'];
    const colors = ['#94a3b8', '#22c55e', '#eab308', '#f97316', '#ef4444'];
    return order.filter(k => counts[k]).map((k, i) => ({ name: k, count: counts[k], fill: colors[order.indexOf(k)] }));
  }, [risks]);

  // ── Incident by Category ─────────────────────────────────────────
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'under_investigation');
  const catCounts = openIncidents.reduce((acc, i) => {
    const cat = i.category?.replace(/_/g, ' ') || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const incidentByCategory = Object.entries(catCounts).map(([name, value]) => ({ name, value }));
  const BAR_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  // ── Last month comparison ────────────────────────────────────────
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  const thisMonthStart = startOfMonth(new Date());
  const incidentsTrend = incidents.filter(i => { try { return isWithinInterval(parseISO(i.incident_date || i.created_date), { start: thisMonthStart, end: new Date() }); } catch { return false; } }).length
    - incidents.filter(i => { try { return isWithinInterval(parseISO(i.incident_date || i.created_date), { start: lastMonthStart, end: lastMonthEnd }); } catch { return false; } }).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" /> Compliance Executive Summary
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{today} · Real-time compliance health overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live data
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Open Incidents" value={openIncidents.length} sub="Requires attention" iconColor="bg-red-500" trend={incidentsTrend} />
        <StatCard icon={Search} label="Pending Audits" value={pendingAudits.length} sub={`${audits.filter(a => a.status === 'in_progress').length} in progress`} iconColor="bg-violet-500" />
        <StatCard icon={TrendingUp} label="Active Risks" value={risks.filter(r => r.status !== 'closed').length} sub={`${risks.filter(r => (r.impact === 'major' || r.impact === 'catastrophic') && r.status !== 'closed').length} high-impact`} iconColor="bg-orange-500" />
        <StatCard icon={FileText} label="Policies Active" value={policies.filter(p => p.status === 'active').length} sub={`${policies.filter(p => p.review_date && new Date(p.review_date) < new Date() && p.status === 'active').length} overdue for review`} iconColor="bg-emerald-500" />
      </div>

      {/* Risk Score Gauges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Real-Time Risk Scores</CardTitle>
          <p className="text-xs text-gray-400">Computed from open incidents, active risks, policy compliance, and training status</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
            <ScoreGauge score={overallRiskScore} label="Overall Compliance Risk" />
            <ScoreGauge score={policyRiskScore} label="Policy Compliance" />
            <ScoreGauge score={trainingRiskScore} label="Training Compliance" />
            <ScoreGauge score={auditRiskScore} label="Audit Readiness" />
          </div>
        </CardContent>
      </Card>

      {/* Incident Trend + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open Incidents — 6 Month Trend</CardTitle>
            <p className="text-xs text-gray-400">Opened vs resolved per month</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={incidentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="opened" name="Opened" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Risk by Impact Level</CardTitle>
            <p className="text-xs text-gray-400">Open risks grouped by potential business impact</p>
          </CardHeader>
          <CardContent>
            {riskDistribution.length === 0
              ? <p className="text-sm text-gray-400 py-12 text-center">No active risks logged.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={riskDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Risks" radius={[0, 4, 4, 0]}>
                      {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Audit Actions + Open Incidents by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-violet-600" /> Pending Audit Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAudits.length === 0
              ? <p className="text-sm text-gray-400 py-8 text-center">No pending audits.</p>
              : (
                <div className="space-y-3">
                  {pendingAudits.map(a => (
                    <div key={a.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{a.audit_type?.replace(/_/g, ' ')} · {a.auditor_name || 'Unassigned'}</p>
                        {a.end_date && <p className="text-xs text-gray-400 mt-0.5">Due: {a.end_date}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                          {a.status?.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS_MAP[a.risk_rating] || 'bg-gray-100 text-gray-600'}`}>{a.risk_rating || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Open Incidents by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {incidentByCategory.length === 0
              ? <p className="text-sm text-gray-400 py-12 text-center">No open incidents.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={incidentByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
                      {incidentByCategory.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Health Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Compliance Health Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Policies', ok: policies.filter(p => p.status === 'active').length, total: policies.length, icon: FileText, color: 'text-emerald-600' },
              { label: 'Active Trainings', ok: trainings.filter(t => t.status === 'active').length, total: trainings.length, icon: GraduationCap, color: 'text-blue-600' },
              { label: 'Completed Audits', ok: audits.filter(a => a.status === 'completed').length, total: audits.length, icon: CheckCircle2, color: 'text-violet-600' },
              { label: 'Mitigated Risks', ok: risks.filter(r => r.status === 'closed' || r.status === 'accepted').length, total: risks.length, icon: ShieldCheck, color: 'text-orange-600' },
            ].map(({ label, ok, total, icon: Icon, color }) => {
              const pct = total ? Math.round((ok / total) * 100) : 0;
              return (
                <div key={label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{ok}<span className="text-sm font-normal text-gray-400">/{total}</span></p>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444' }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const RISK_COLORS_MAP = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };