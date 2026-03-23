import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GanttChart({ tasks = [] }) {
  // Calculate date range
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const weeks = [];
  for (let i = 0; i < daysDiff; i += 7) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i);
    weeks.push(weekStart);
  }

  const getTaskPosition = (task) => {
    if (!task.due_date) {
      return { left: 0, width: 0 };
    }

    const taskDate = new Date(task.due_date);
    const daysFromStart = Math.ceil((taskDate - startDate) / (1000 * 60 * 60 * 24));
    const left = (daysFromStart / daysDiff) * 100;
    const width = 5; // Fixed width for now

    return { left: Math.max(0, Math.min(95, left)), width };
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Timeline View</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline header */}
        <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="w-48 flex-shrink-0 font-medium text-sm">Task</div>
          <div className="flex-1 flex">
            {weeks.map((week, idx) => (
              <div key={idx} className="flex-1 text-center text-xs text-gray-500">
                {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {tasks.slice(0, 10).map((task) => {
            const pos = getTaskPosition(task);
            return (
              <div key={task.id} className="flex items-center">
                <div className="w-48 flex-shrink-0 text-sm truncate">{task.title}</div>
                <div className="flex-1 relative h-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                  {pos.width > 0 && (
                    <div
                      className="absolute h-6 bg-violet-500 rounded flex items-center justify-center"
                      style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                    >
                      <Badge className="text-xs bg-white/20">{task.status}</Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
