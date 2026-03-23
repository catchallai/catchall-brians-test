import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle } from 'lucide-react';

export default function ResourcePlanner({ tasks = [], timeLogs = [] }) {
  const teamMembers = [...new Set(tasks.map((t) => t.assigned_to).filter(Boolean))];

  const getMemberStats = (email) => {
    const memberTasks = tasks.filter((t) => t.assigned_to === email);
    const totalHours = memberTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completedTasks = memberTasks.filter((t) => t.status === 'done').length;
    const memberLogs = timeLogs.filter((l) => l.user_email === email);
    const loggedHours = memberLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

    const capacity = 40; // weekly capacity
    const utilization = (totalHours / capacity) * 100;

    return {
      totalTasks: memberTasks.length,
      completedTasks,
      totalHours,
      loggedHours,
      utilization: Math.min(100, utilization),
      isOverloaded: utilization > 100,
    };
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Resource Planning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No team members assigned yet</p>
        ) : (
          teamMembers.map((email) => {
            const stats = getMemberStats(email);
            return (
              <div key={email} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{email.split('@')[0]}</span>
                  <div className="flex items-center gap-2">
                    {stats.isOverloaded && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <Badge
                      className={
                        stats.isOverloaded
                          ? 'bg-red-100 text-red-800'
                          : stats.utilization > 80
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }
                    >
                      {stats.utilization.toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                <Progress value={stats.utilization} />

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">{stats.totalTasks}</span> tasks
                  </div>
                  <div>
                    <span className="font-medium">{stats.totalHours.toFixed(0)}h</span> allocated
                  </div>
                  <div>
                    <span className="font-medium">{stats.loggedHours.toFixed(1)}h</span> logged
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
