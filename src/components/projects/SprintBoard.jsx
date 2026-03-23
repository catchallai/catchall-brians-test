import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target } from 'lucide-react';

export default function SprintBoard({ sprint, tasks = [] }) {
  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);
  const completedTasks = sprintTasks.filter((t) => t.status === 'done').length;
  const progress = sprintTasks.length > 0 ? (completedTasks / sprintTasks.length) * 100 : 0;

  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const completedPoints = sprintTasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + (t.story_points || 0), 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{sprint.name}</CardTitle>
          <Badge
            className={
              sprint.status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : sprint.status === 'completed'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800'
            }
          >
            {sprint.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{sprint.goal}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(sprint.start_date).toLocaleDateString()} -{' '}
              {new Date(sprint.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>
              {completedTasks}/{sprintTasks.length} tasks
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" />
            <span className="text-sm">Story Points</span>
          </div>
          <span className="font-semibold">
            {completedPoints}/{totalPoints}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
