import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, CheckSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivityItem({ activity, onToggleComplete }) {
  const typeIcons = {
    call: Phone,
    email: Mail,
    meeting: Calendar,
    task: CheckSquare,
    note: FileText,
  };

  const typeColors = {
    call: 'bg-blue-50 text-blue-600',
    email: 'bg-violet-50 text-violet-600',
    meeting: 'bg-amber-50 text-amber-600',
    task: 'bg-emerald-50 text-emerald-600',
    note: 'bg-gray-50 text-gray-600',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };

  const Icon = typeIcons[activity.type] || FileText;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all ${activity.completed ? 'opacity-60' : ''}`}
    >
      <Checkbox
        checked={activity.completed}
        onCheckedChange={() => onToggleComplete?.(activity)}
        className="mt-1"
      />
      <div className={`p-2 rounded-lg ${typeColors[activity.type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`font-medium text-gray-900 ${activity.completed ? 'line-through' : ''}`}>
            {activity.title}
          </h4>
          {activity.priority && activity.priority !== 'medium' && (
            <Badge className={`${priorityColors[activity.priority]} text-xs`}>
              {activity.priority}
            </Badge>
          )}
        </div>
        {activity.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{activity.description}</p>
        )}
        {activity.due_date && (
          <span className="text-xs text-gray-400">
            Due {format(new Date(activity.due_date), 'MMM d, yyyy h:mm a')}
          </span>
        )}
      </div>
    </div>
  );
}
