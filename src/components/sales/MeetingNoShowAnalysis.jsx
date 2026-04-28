import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function MeetingNoShowAnalysis({ bookings = [] }) {
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const noShows = bookings.filter((b) => b.status === 'no_show').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const total = bookings.length;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  const getAttendeePatterns = () => {
    const patterns = {};
    bookings.forEach((b) => {
      const attendee = b.attendee_email || 'Unknown';
      if (!patterns[attendee]) {
        patterns[attendee] = { total: 0, noShows: 0 };
      }
      patterns[attendee].total++;
      if (b.status === 'no_show') {
        patterns[attendee].noShows++;
      }
    });
    return Object.entries(patterns)
      .map(([email, data]) => ({
        email,
        ...data,
        rate: Math.round((data.noShows / data.total) * 100),
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
  };

  const patterns = getAttendeePatterns();

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Meeting Patterns</h3>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completed}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">No Shows</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{noShows}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Cancelled</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{cancelled}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {completionRate.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {patterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              High No-Show Attendees
            </p>
            {patterns.map((p) => (
              <div key={p.email} className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-900 dark:text-amber-200 truncate">{p.email}</span>
                  <Badge variant="outline">{p.rate}%</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
