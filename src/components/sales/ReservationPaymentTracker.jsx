import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function ReservationPaymentTracker({ reservations = [] }) {
  const withPayment = reservations.filter((r) => r.payment_status);
  const unpaid = withPayment.filter((r) => r.payment_status === 'pending');
  const paid = withPayment.filter((r) => r.payment_status === 'completed');
  const overdue = withPayment.filter((r) => r.payment_status === 'overdue');

  const totalValue = reservations.reduce((sum, r) => sum + (r.value || 0), 0);
  const paidValue = paid.reduce((sum, r) => sum + (r.value || 0), 0);
  const unpaidValue = unpaid.reduce((sum, r) => sum + (r.value || 0), 0);
  const overdueValue = overdue.reduce((sum, r) => sum + (r.value || 0), 0);

  const paymentRate = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

  const getExpiringReservations = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return reservations
      .filter((r) => {
        const resDate = new Date(r.reservation_date);
        return resDate > today && resDate <= sevenDaysFromNow && r.status !== 'completed';
      })
      .sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date));
  };

  const expiringReservations = getExpiringReservations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Status</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${(totalValue / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${paymentRate}%` }} />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {paymentRate.toFixed(0)}% paid
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs text-green-600 dark:text-green-400">Paid</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                ${(paidValue / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {paid.length} reservations
              </p>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                ${(unpaidValue / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {unpaid.length} reservations
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">Overdue</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                ${(overdueValue / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {overdue.length} reservations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {expiringReservations.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Expiring Soon
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expiringReservations.map((res) => (
                <div key={res.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {res.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Expires: {new Date(res.reservation_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      ${(res.value / 1000).toFixed(0)}k
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
