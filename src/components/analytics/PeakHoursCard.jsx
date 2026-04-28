import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function PeakHoursCard({ data }) {
  // Generate heatmap data for 7 days x 24 hours
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const heatmapData =
    data ||
    days.map((day) => ({
      day,
      hours: hours.map((hour) => ({
        hour,
        value: Math.floor(Math.random() * 100),
      })),
    }));

  const getColor = (value) => {
    if (value < 20) {
      return 'bg-gray-100 dark:bg-gray-700';
    }
    if (value < 40) {
      return 'bg-violet-100 dark:bg-violet-900/30';
    }
    if (value < 60) {
      return 'bg-violet-300 dark:bg-violet-700';
    }
    if (value < 80) {
      return 'bg-violet-500';
    }
    return 'bg-violet-700';
  };

  // Find peak hour
  let peakHour = { day: '', hour: 0, value: 0 };
  heatmapData.forEach((dayData) => {
    dayData.hours.forEach((hourData) => {
      if (hourData.value > peakHour.value) {
        peakHour = { day: dayData.day, hour: hourData.hour, value: hourData.value };
      }
    });
  });

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" />
            Peak Hours Heatmap
          </CardTitle>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Peak:{' '}
            <span className="font-medium text-violet-600">
              {peakHour.day} {peakHour.hour}:00
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-10" />
              {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                <div key={h} className="flex-1 text-xs text-gray-400 text-center">
                  {h.toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {heatmapData.map((dayData) => (
                <div key={dayData.day} className="flex items-center gap-1">
                  <span className="w-10 text-xs text-gray-500 dark:text-gray-400">
                    {dayData.day}
                  </span>
                  <div className="flex-1 flex gap-0.5">
                    {dayData.hours.map((hourData) => (
                      <div
                        key={hourData.hour}
                        className={`flex-1 h-6 rounded-sm ${getColor(hourData.value)} transition-all hover:scale-110 cursor-pointer`}
                        title={`${dayData.day} ${hourData.hour}:00 - ${hourData.value}% activity`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-xs text-gray-400">Low</span>
              <div className="flex gap-0.5">
                {[
                  'bg-gray-100 dark:bg-gray-700',
                  'bg-violet-100',
                  'bg-violet-300',
                  'bg-violet-500',
                  'bg-violet-700',
                ].map((color, i) => (
                  <div key={i} className={`w-4 h-3 rounded-sm ${color}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400">High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
