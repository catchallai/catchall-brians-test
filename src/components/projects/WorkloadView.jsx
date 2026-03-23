import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export default function WorkloadView({ workloads = [] }) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {workloads.map((workload) => {
          const utilization = workload.utilization || 0;
          const isOverloaded = utilization > 100;

          return (
            <div key={workload.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{workload.user_email?.split('@')[0]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {workload.total_hours}h / {workload.capacity_hours}h
                  </span>
                  <Badge
                    className={
                      isOverloaded
                        ? 'bg-red-100 text-red-800'
                        : utilization > 80
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-emerald-100 text-emerald-800'
                    }
                  >
                    {utilization.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress value={Math.min(100, utilization)} />

              {workload.task_breakdown && (
                <div className="pl-4 space-y-1">
                  {workload.task_breakdown.slice(0, 3).map((task, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-600">
                      <span className="truncate">{task.task_title}</span>
                      <span>{task.hours}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
