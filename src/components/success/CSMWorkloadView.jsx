import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CSMWorkloadView() {
  const { data: workloads = [] } = useQuery({
    queryKey: ['csm-workload'],
    queryFn: () => base44.entities.CSMWorkload.list('-performance_score', 100),
  });

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            CSM Portfolio Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {workloads.map((csm) => (
              <div key={csm.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{csm.csm_name}</p>
                    <p className="text-xs text-gray-500">{csm.csm_email}</p>
                  </div>
                  <Badge
                    className={
                      csm.capacity_utilization > 90
                        ? 'bg-red-100 text-red-800'
                        : csm.capacity_utilization > 75
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }
                  >
                    {csm.capacity_utilization}% capacity
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Customers</p>
                    <p className="font-bold text-gray-900 dark:text-white">{csm.total_customers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Critical</p>
                    <p className="font-bold text-red-600">{csm.critical_customers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">At Risk</p>
                    <p className="font-bold text-yellow-600">{csm.at_risk_customers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Health Score</p>
                    <p className="font-bold text-violet-600">{csm.avg_health_score.toFixed(0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-600">{csm.open_tasks} open tasks</span>
                  {csm.overdue_tasks > 0 && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-gray-600">{csm.overdue_tasks} overdue</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
