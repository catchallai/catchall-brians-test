import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReservationCalendarView({ reservations = [] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = [];
  const firstDay = firstDayOfMonth(currentDate);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth(currentDate); i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const getReservationsForDate = (date) => {
    if (!date) {
      return [];
    }
    return reservations.filter((r) => {
      const resDate = new Date(r.reservation_date);
      return resDate.toDateString() === date.toDateString();
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">{monthName}</h3>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            const resForDay = getReservationsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`min-h-24 p-1 rounded-lg border ${
                  !date
                    ? 'bg-gray-50 dark:bg-gray-800 border-transparent'
                    : isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {date && (
                  <>
                    <p
                      className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      {date.getDate()}
                    </p>
                    <div className="space-y-0.5">
                      {resForDay.slice(0, 2).map((res) => (
                        <div
                          key={res.id}
                          className={`text-xs p-1 rounded truncate text-white ${
                            res.status === 'confirmed'
                              ? 'bg-green-500'
                              : res.status === 'pending'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          title={res.title}
                        >
                          {res.title}
                        </div>
                      ))}
                      {resForDay.length > 2 && (
                        <p className="text-xs text-gray-500 px-1">+{resForDay.length - 2} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
