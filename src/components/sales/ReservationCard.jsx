import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Package, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700',
};

const paymentColors = {
  unpaid: 'bg-red-100 text-red-700',
  deposit_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

export default function ReservationCard({ reservation, contactName, dealName, onEdit }) {
  return (
    <Card className="glass-card hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-gray-900">{reservation.title}</p>
            <p className="text-sm text-gray-600">{contactName}</p>
            {dealName && <p className="text-xs text-gray-500">{dealName}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${statusColors[reservation.status]} border-0 text-xs`}>
            {reservation.status}
          </Badge>
          <Badge className={`${paymentColors[reservation.payment_status]} border-0 text-xs`}>
            {reservation.payment_status.replace('_', ' ')}
          </Badge>
        </div>

        {reservation.product_service && (
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>{reservation.product_service}</span>
          </div>
        )}

        {reservation.value && (
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>${reservation.value.toLocaleString()}</span>
            {reservation.quantity > 1 && (
              <span className="text-xs text-gray-500">x{reservation.quantity}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(reservation.reservation_date), 'MMM d, yyyy h:mm a')}</span>
        </div>

        {reservation.expiry_date && (
          <p className="text-xs text-amber-600 mt-2">
            Expires: {format(new Date(reservation.expiry_date), 'MMM d, yyyy')}
          </p>
        )}

        {reservation.description && (
          <p className="text-xs text-gray-600 mt-3 line-clamp-2">{reservation.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
