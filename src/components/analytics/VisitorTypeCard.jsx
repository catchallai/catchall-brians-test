import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function VisitorTypeCard({ data }) {
  // SyberJet visitor data - high-value returning visitors typical for luxury aviation
  const visitorData = data || [
    { name: 'New Visitors', value: 54, color: '#8b5cf6' },
    { name: 'Returning', value: 46, color: '#06b6d4' },
  ];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" />
          New vs Returning Visitors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitorData}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {visitorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Visitors
                </span>
              </div>
              <span className="text-lg font-bold text-violet-600">{visitorData[0].value}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Returning
                </span>
              </div>
              <span className="text-lg font-bold text-cyan-600">{visitorData[1].value}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
