import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Scale, FileText, Briefcase, Shield, AlertTriangle, Users,
  Building2, ChevronRight, Clock, TrendingUp, CheckCircle2
} from 'lucide-react';

const PRIORITY_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
const STATUS_COLORS = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', on_hold: 'bg-gray-100 text-gray-600', closed: 'bg-green-100 text-green-700' };

function NavCard({ to, icon: Icon, label, value, sub, color }) {
  return (
    <Link to={createPageUrl(to)}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function LegalDashboard() {
  const { data: matters = [] } = useQuery({ queryKey: ['legal-matters'], queryFn: () => base44.entities.LegalMatter.list() });
  const { data: obligations = [] } = useQuery({ queryKey: ['legal-obligations'], queryFn: () => base44.entities.LegalObligation.list() });
  const { data: ip = [] } = useQuery({ queryKey: ['legal-ip'], queryFn: () => base44.entities.IPAsset.list() });
  const { data: litigation = [] } = useQuery({ queryKey: ['legal-litigation'], queryFn: () => base44.entities.Litigation.list() });
  const { data: counsel = [] } = useQuery({ queryKey: ['legal-counsel'], queryFn: () => base44.entities.LegalCounsel.list() });
  const { data: entities = [] } = useQuery({ queryKey: ['legal-entities'], queryFn: () => base44.entities.LegalEntity.list() });
  const { data: documents = [] } = useQuery({ queryKey: ['legal-documents-all'], queryFn: () => base44.entities.LegalDocument.list() });

  const today = new Date();
  const openMatters = matters.filter(m => m.status === 'open' || m.status === 'in_progress');
  const urgentMatters = matters.filter(m => m.priority === 'urgent');
  const activeLitigation = litigation.filter(l => !['settled', 'dismissed', 'closed'].includes(l.status));
  const overdueObligations = obligations.filter(o => o.due_date && new Date(o.due_date) < today && o.status === 'active');
  const expiringIP = ip.filter(a => a.expiry_date && new Date(a.expiry_date) > today && new Date(a.expiry_date) < new Date(today.getTime() + 90 * 86400000));
  const totalLegalReserve = litigation.reduce((sum, l) => sum + (l.legal_reserve || 0), 0);

  const recentMatters = [...matters].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);
  const upcomingDeadlines = [
    ...matters.filter(m => m.deadline).map(m => ({ id: m.id, title: m.title, date: m.deadline, type: 'Matter', color: 'text-blue-600' })),
    ...obligations.filter(o => o.due_date).map(o => ({ id: o.id, title: o.title, date: o.due_date, type: 'Obligation', color: 'text-orange-600' })),
    ...litigation.filter(l => l.next_hearing_date).map(l => ({ id: l.id, title: l.case_name, date: l.next_hearing_date, type: 'Hearing', color: 'text-red-600' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-600" /> Legal Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all legal matters, obligations, IP, and litigation</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <NavCard to="LegalMatters" icon={Briefcase} label="Open Matters" value={openMatters.length} sub={`${urgentMatters.length} urgent`} color="bg-indigo-500" />
        <NavCard to="LegalDocuments" icon={FileText} label="Documents" value={documents.length} sub={`${documents.filter(d => d.status === 'signed').length} signed`} color="bg-violet-500" />
        <NavCard to="LegalLitigation" icon={Scale} label="Active Cases" value={activeLitigation.length} sub={`$${(totalLegalReserve / 1000).toFixed(0)}k reserved`} color="bg-red-500" />
        <NavCard to="LegalObligations" icon={AlertTriangle} label="Obligations" value={obligations.length} sub={`${overdueObligations.length} overdue`} color={overdueObligations.length > 0 ? 'bg-orange-500' : 'bg-emerald-500'} />
        <NavCard to="LegalIP" icon={Shield} label="IP Assets" value={ip.length} sub={`${expiringIP.length} expiring soon`} color="bg-blue-500" />
        <NavCard to="LegalCounsel" icon={Users} label="Counsel" value={counsel.filter(c => c.status === 'active').length} sub="active attorneys" color="bg-teal-500" />
        <NavCard to="LegalEntities" icon={Building2} label="Entities" value={entities.length} sub={`${entities.filter(e => e.status === 'active').length} active`} color="bg-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matters */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Matters</CardTitle>
            <Link to={createPageUrl('LegalMatters')} className="text-xs text-indigo-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentMatters.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No matters yet.</p> :
              <div className="space-y-2">
                {recentMatters.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.title}</p>
                      <p className="text-xs text-gray-500">{m.matter_type?.replace(/_/g, ' ')} · {m.assigned_attorney || 'Unassigned'}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[m.priority] || ''}`}>{m.priority}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || ''}`}>{m.status?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No upcoming deadlines.</p> :
              <div className="space-y-2">
                {upcomingDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{d.title}</p>
                      <p className={`text-xs font-medium ${d.color}`}>{d.type}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{new Date(d.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Overdue Obligations Warning */}
      {overdueObligations.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Overdue Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueObligations.slice(0, 4).map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{o.title}</p>
                    <p className="text-xs text-gray-500">{o.obligation_type?.replace(/_/g, ' ')} · {o.owner_name || '—'}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium">Due {new Date(o.due_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}