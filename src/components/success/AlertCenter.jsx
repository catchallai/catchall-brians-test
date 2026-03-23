import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertCenter() {
  const { data: alerts = [] } = useQuery({
    queryKey: ['customer-alerts'],
    queryFn: () => base44.entities.CustomerAlert.filter({ is_active: true }, '-created_date', 50),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const severityColor = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };

  const severityIcon = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    critical: <AlertTriangle className="w-5 h-5 text-red-500" />,
  };

  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const warning = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{critical}</p>
            <p className="text-xs text-gray-500">Critical</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{warning}</p>
            <p className="text-xs text-gray-500">Warnings</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{alerts.length}</p>
            <p className="text-xs text-gray-500">Total Alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.slice(0, 20).map((alert) => {
          const contact = contacts.find((c) => c.id === alert.contact_id);

          return (
            <Card
              key={alert.id}
              className={`glass-card border-l-4 ${
                alert.severity === 'critical'
                  ? 'border-l-red-500'
                  : alert.severity === 'warning'
                    ? 'border-l-yellow-500'
                    : 'border-l-blue-500'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {severityIcon[alert.severity]}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{alert.title}</p>
                      <Badge className={severityColor[alert.severity]}>{alert.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {contact?.first_name} {contact?.last_name} • {alert.recommended_action}
                    </p>
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
