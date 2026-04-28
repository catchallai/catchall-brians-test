import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const priorityColors = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

export default function TimelineView({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysArray = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  };

  const days = getDaysArray();
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline View</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium min-w-[140px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <Button size="sm" variant="outline" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full">
              {/* Task names column */}
              <div className="w-48 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 z-10">
                <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 font-semibold text-sm bg-gray-50 dark:bg-gray-900">
                  Tasks
                </div>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>

              {/* Timeline grid */}
              <div className="flex-1">
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {days.map((day, idx) => {
                    const isToday = day.toDateString() === today.toDateString();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={idx}
                        className={`h-12 w-12 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-xs ${
                          isToday ? 'bg-violet-100 dark:bg-violet-900/40 font-bold' : ''
                        } ${isWeekend ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      >
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={isToday ? 'text-violet-600 dark:text-violet-400' : ''}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {tasks.map((task) => {
                  const taskDueDate = task.due_date ? new Date(task.due_date) : null;
                  const taskStartDate = task.start_date ? new Date(task.start_date) : taskDueDate;

                  return (
                    <div
                      key={task.id}
                      className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {days.map((day, idx) => {
                        const hasTask =
                          taskDueDate && day.toDateString() === taskDueDate.toDateString();
                        const isInRange =
                          taskStartDate &&
                          taskDueDate &&
                          day >= taskStartDate &&
                          day <= taskDueDate;

                        return (
                          <div
                            key={idx}
                            className="h-12 w-12 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-1 relative"
                          >
                            {hasTask && (
                              <div
                                className={`absolute inset-1 rounded ${priorityColors[task.priority] || priorityColors.medium} opacity-80`}
                                title={`${task.title} - ${task.priority || 'medium'} priority`}
                              />
                            )}
                            {isInRange && !hasTask && (
                              <div
                                className={`absolute inset-y-1 left-0 right-0 ${priorityColors[task.priority] || priorityColors.medium} opacity-30`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">Priority:</span>
        {Object.entries(priorityColors).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="capitalize text-gray-600 dark:text-gray-400">{priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
