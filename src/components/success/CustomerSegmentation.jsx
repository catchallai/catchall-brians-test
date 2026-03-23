import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function CustomerSegmentation({ contacts = [], healthScores = [] }) {
  const segments = useMemo(() => {
    const segmentation = {
      enterprise: { count: 0, health: 0, risk: 0, expansion: 0, contacts: [] },
      midmarket: { count: 0, health: 0, risk: 0, expansion: 0, contacts: [] },
      smb: { count: 0, health: 0, risk: 0, expansion: 0, contacts: [] },
    };

    const customers = contacts.filter((c) => c.status === 'customer');

    customers.forEach((contact) => {
      const health = healthScores.find((h) => h.contact_id === contact.id);
      const size = contact.company_size || 'smb';

      if (health) {
        segmentation[size].count++;
        segmentation[size].health += health.health_score || 0;
        if (health.health_status === 'at_risk' || health.health_status === 'critical') {
          segmentation[size].risk++;
        }
        if (health.positive_signals?.some((s) => s.includes('expansion') || s.includes('upsell'))) {
          segmentation[size].expansion++;
        }
        segmentation[size].contacts.push({ ...contact, health });
      }
    });

    // Calculate averages
    Object.keys(segmentation).forEach((key) => {
      if (segmentation[key].count > 0) {
        segmentation[key].health = Math.round(segmentation[key].health / segmentation[key].count);
      }
    });

    return segmentation;
  }, [contacts, healthScores]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Customer Segments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(segments).map(([segment, data]) => (
            <div
              key={segment}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{segment}</p>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {data.count} customers
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Health</span>
                  <span
                    className={`font-bold ${
                      data.health >= 75
                        ? 'text-green-600'
                        : data.health >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {data.health}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> At Risk
                  </span>
                  <span className="font-bold text-red-600">{data.risk}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Expansion
                  </span>
                  <span className="font-bold text-green-600">{data.expansion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
