import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle } from 'lucide-react';

export default function RenewalTracker() {
  const { data: renewals = [] } = useQuery({
    queryKey: ['renewal-forecasts'],
    queryFn: () => base44.entities.RenewalForecast.list('-renewal_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const nextMonth = renewals.filter((r) => r.days_to_renewal <= 30 && r.days_to_renewal > 0);
  const atRisk = renewals.filter((r) => r.renewal_status === 'at_risk');
  const totalARR = renewals.reduce((sum, r) => sum + (r.contract_value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{nextMonth.length}</p>
            <p className="text-xs text-gray-500">Next 30 Days</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{atRisk.length}</p>
            <p className="text-xs text-gray-500">At Risk</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">${(totalARR / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500">Total ARR</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {renewals
          .sort((a, b) => a.days_to_renewal - b.days_to_renewal)
          .slice(0, 15)
          .map((renewal) => {
            const contact = contacts.find((c) => c.id === renewal.contact_id);
            const daysLeft = renewal.days_to_renewal;
            const isUrgent = daysLeft <= 30;

            return (
              <Card key={renewal.id} className={`glass-card ${isUrgent ? 'border-amber-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contact?.first_name} {contact?.last_name}
                        </p>
                        {isUrgent && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(renewal.renewal_date).toLocaleDateString()} ({daysLeft} days)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        ${renewal.contract_value?.toLocaleString()}
                      </p>
                      <Badge
                        className={
                          renewal.renewal_status === 'at_risk'
                            ? 'bg-red-100 text-red-800'
                            : renewal.renewal_status === 'likely'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {renewal.renewal_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
