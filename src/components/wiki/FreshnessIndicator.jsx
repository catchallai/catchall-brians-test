import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function FreshnessIndicator({ page }) {
  if (!page || !page.updated_date) {
    return null;
  }

  const daysSinceUpdate = (new Date() - new Date(page.updated_date)) / (1000 * 60 * 60 * 24);

  let label = 'Up to date';
  let icon = CheckCircle;
  let className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';

  if (daysSinceUpdate > 90) {
    label = 'Needs review';
    icon = AlertCircle;
    className = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  } else if (daysSinceUpdate > 30) {
    label = 'Consider updating';
    icon = Clock;
    className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  }

  const Icon = icon;

  return (
    <Badge className={className} title={`Last updated ${Math.floor(daysSinceUpdate)} days ago`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
