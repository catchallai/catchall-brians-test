import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Mail, Eye, MessageSquare, CheckCircle } from 'lucide-react';

export default function EmailAnalytics({ outreach }) {
  const totalSent = outreach.filter((o) => o.status !== 'draft').length;
  const opened = outreach.filter((o) =>
    ['opened', 'replied', 'published'].includes(o.status)
  ).length;
  const replied = outreach.filter((o) => ['replied', 'published'].includes(o.status)).length;
  const published = outreach.filter((o) => o.status === 'published').length;

  const statusData = [
    { name: 'Sent', value: totalSent - opened, color: '#6b7280' },
    { name: 'Opened', value: opened - replied, color: '#8b5cf6' },
    { name: 'Replied', value: replied - published, color: '#10b981' },
    { name: 'Published', value: published, color: '#06b6d4' },
  ].filter((d) => d.value > 0);

  const stats = [
    { label: 'Total Sent', value: totalSent, icon: Mail, color: 'text-gray-600' },
    { label: 'Opened', value: opened, icon: Eye, color: 'text-violet-600' },
    { label: 'Replied', value: replied, icon: MessageSquare, color: 'text-emerald-600' },
    { label: 'Published', value: published, icon: CheckCircle, color: 'text-cyan-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle>Outreach Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle>Response Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
