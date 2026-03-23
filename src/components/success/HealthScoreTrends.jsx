import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function HealthScoreTrends({ healthScores, contacts }) {
  const [view, setView] = useState('segment');

  // Process data by segment over time
  const segmentTrends = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    return last30Days.map((date) => {
      const dayScores = healthScores.filter((h) => {
        const scoreDate = new Date(h.last_calculated || h.created_date).toISOString().split('T')[0];
        return scoreDate <= date;
      });

      const segments = {
        enterprise: dayScores.filter((s) => {
          const contact = contacts.find((c) => c.id === s.contact_id);
          return contact?.segment === 'enterprise';
        }),
        smb: dayScores.filter((s) => {
          const contact = contacts.find((c) => c.id === s.contact_id);
          return contact?.segment === 'smb';
        }),
        startup: dayScores.filter((s) => {
          const contact = contacts.find((c) => c.id === s.contact_id);
          return contact?.segment === 'startup';
        }),
      };

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        enterprise:
          segments.enterprise.length > 0
            ? Math.round(
                segments.enterprise.reduce((sum, s) => sum + s.health_score, 0) /
                  segments.enterprise.length
              )
            : 0,
        smb:
          segments.smb.length > 0
            ? Math.round(
                segments.smb.reduce((sum, s) => sum + s.health_score, 0) / segments.smb.length
              )
            : 0,
        startup:
          segments.startup.length > 0
            ? Math.round(
                segments.startup.reduce((sum, s) => sum + s.health_score, 0) /
                  segments.startup.length
              )
            : 0,
      };
    });
  }, [healthScores, contacts]);

  // Process data by CSM
  const csmPerformance = useMemo(() => {
    const csmMap = {};

    healthScores.forEach((h) => {
      const contact = contacts.find((c) => c.id === h.contact_id);
      if (contact?.assigned_csm) {
        if (!csmMap[contact.assigned_csm]) {
          csmMap[contact.assigned_csm] = {
            name: contact.assigned_csm,
            scores: [],
            totalCustomers: 0,
          };
        }
        csmMap[contact.assigned_csm].scores.push(h.health_score);
        csmMap[contact.assigned_csm].totalCustomers++;
      }
    });

    return Object.values(csmMap)
      .map((csm) => ({
        name: csm.name,
        avgScore: Math.round(csm.scores.reduce((sum, s) => sum + s, 0) / csm.scores.length),
        customers: csm.totalCustomers,
        healthy: csm.scores.filter((s) => s >= 75).length,
        atRisk: csm.scores.filter((s) => s >= 50 && s < 75).length,
        critical: csm.scores.filter((s) => s < 50).length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [healthScores, contacts]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Health Score Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mb-4">
            <TabsTrigger value="segment">By Segment</TabsTrigger>
            <TabsTrigger value="csm">By CSM</TabsTrigger>
          </TabsList>

          <TabsContent value="segment" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={segmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="enterprise"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Enterprise"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="smb"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="SMB"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="startup"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Startup"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="csm" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={csmPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="avgScore"
                    fill="#8b5cf6"
                    name="Avg Health Score"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* CSM Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {csmPerformance.map((csm, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{csm.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Avg Score</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{csm.avgScore}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Customers</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{csm.customers}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600">Healthy</p>
                      <p className="font-semibold text-emerald-700">{csm.healthy}</p>
                    </div>
                    <div>
                      <p className="text-red-600">Critical</p>
                      <p className="font-semibold text-red-700">{csm.critical}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
