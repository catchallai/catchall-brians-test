import { Card } from '@/components/ui/card';
import { Calendar, DollarSign, Percent } from 'lucide-react';
import { format } from 'date-fns';

export default function DealCard({ deal, contact, onDragStart, onDragEnd }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <Card
      className="p-4 border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStart?.(e, deal)}
      onDragEnd={onDragEnd}
    >
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 line-clamp-2">{deal.title}</h4>

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-lg font-bold text-emerald-600">{formatCurrency(deal.value)}</span>
        </div>

        {contact && (
          <p className="text-sm text-gray-500 truncate">
            {contact.first_name} {contact.last_name}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {deal.expected_close_date && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {format(new Date(deal.expected_close_date), 'MMM d')}
            </span>
          )}
          {deal.probability && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Percent className="w-3 h-3" />
              {deal.probability}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
