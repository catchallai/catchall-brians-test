import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Users } from 'lucide-react';

export default function CSMPerformanceCard({ onboardings, healthScores, opportunities }) {
  const csmMetrics = React.useMemo(() => {
    const metrics = {};

    onboardings.forEach((o) => {
      const csm = o.csm_assigned || 'Unassigned';
      if (!metrics[csm]) {
        metrics[csm] = {
          name: csm,
          customers: 0,
          avgHealth: 0,
          healthCount: 0,
          completedOnboarding: 0,
          totalOnboarding: 0,
          opportunities: 0,
          opportunityValue: 0,
        };
      }

      metrics[csm].totalOnboarding++;
      if (o.status === 'completed') {
        metrics[csm].completedOnboarding++;
      }

      const health = healthScores.find((h) => h.contact_id === o.contact_id);
      if (health) {
        metrics[csm].avgHealth += health.health_score || 0;
        metrics[csm].healthCount++;
      }

      const customerOpps = opportunities.filter((opp) => opp.contact_id === o.contact_id);
      metrics[csm].opportunities += customerOpps.length;
      metrics[csm].opportunityValue += customerOpps.reduce(
        (sum, opp) => sum + (opp.estimated_value || 0),
        0
      );
    });

    return Object.values(metrics)
      .map((m) => ({
        ...m,
        avgHealth: m.healthCount > 0 ? Math.round(m.avgHealth / m.healthCount) : 0,
        completionRate:
          m.totalOnboarding > 0 ? Math.round((m.completedOnboarding / m.totalOnboarding) * 100) : 0,
      }))
      .sort((a, b) => b.avgHealth - a.avgHealth);
  }, [onboardings, healthScores, opportunities]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          CSM Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {csmMetrics.slice(0, 5).map((csm, index) => (
            <div
              key={csm.name}
              className="p-3 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-900/20 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {index === 0 && <Award className="w-4 h-4 text-amber-500" />}
                  <p className="font-semibold text-sm">{csm.name}</p>
                </div>
                <Badge className="bg-violet-100 text-violet-700 border-0">
                  {csm.avgHealth}/100
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <Users className="w-3 h-3 mx-auto mb-1 text-blue-500" />
                  <p className="font-semibold">{csm.totalOnboarding}</p>
                  <p className="text-gray-500">Customers</p>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <TrendingUp className="w-3 h-3 mx-auto mb-1 text-emerald-500" />
                  <p className="font-semibold">{csm.completionRate}%</p>
                  <p className="text-gray-500">Completion</p>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <Award className="w-3 h-3 mx-auto mb-1 text-violet-500" />
                  <p className="font-semibold">${(csm.opportunityValue / 1000).toFixed(0)}K</p>
                  <p className="text-gray-500">Pipeline</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
