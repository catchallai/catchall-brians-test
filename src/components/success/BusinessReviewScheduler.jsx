import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, CheckCircle } from 'lucide-react';

export default function BusinessReviewScheduler({ contacts = [] }) {
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [scheduleError, setScheduleError] = useState('');

  const scheduleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('scheduleBusinessReview', data),
    onSuccess: () => {
      setSelected(null);
      setDate('');
      setTime('');
    },
  });

  const handleSchedule = () => {
    if (!selected || !date || !time) {
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (scheduledAt <= new Date()) {
      setScheduleError('Scheduled time must be in the future.');
      return;
    }
    setScheduleError('');
    const dateTime = scheduledAt.toISOString();

    scheduleMutation.mutate({
      contact_id: selected.id,
      contact_name: `${selected.first_name} ${selected.last_name}`,
      contact_email: selected.email,
      title: `Business Review - ${selected.first_name} ${selected.last_name}`,
      scheduled_date: dateTime,
      duration_minutes: duration,
    });
  };

  const customers = contacts.filter((c) => c.status === 'customer');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
          Schedule Business Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            Customer
          </label>
          <select
            value={selected?.id || ''}
            onChange={(e) => setSelected(customers.find((c) => c.id === e.target.value))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toLocaleDateString('en-CA')}
                  onChange={(e) => {
                    setScheduleError('');
                    setDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>

            {scheduleError && <p className="text-xs text-red-500">{scheduleError}</p>}
            <Button
              onClick={handleSchedule}
              disabled={scheduleMutation.isPending || !date || !time}
              className="w-full gap-2 text-sm"
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scheduling...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Schedule Review
                </>
              )}
            </Button>

            {scheduleMutation.isSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800">
                <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                  ✓ Business review scheduled! Calendar invite sent to {selected.email}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
