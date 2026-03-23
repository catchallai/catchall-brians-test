import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

const statusConfig = {
  pass: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
  },
  fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
};

const priorityColors = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

export default function SEOCheckCard({ check, onClick }) {
  const config = statusConfig[check.status];
  const StatusIcon = config.icon;

  return (
    <Card
      className={`p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${config.bg}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <StatusIcon className={`w-5 h-5 mt-0.5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{check.check_name}</h4>
            <div className="flex items-center gap-2">
              {check.priority && (
                <Badge className={`${priorityColors[check.priority]} text-xs border-0`}>
                  {check.priority}
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          {check.details && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{check.details}</p>
          )}
          <Badge className={`${config.badge} text-xs mt-2 border-0`}>
            {check.check_type.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
