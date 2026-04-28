import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function CSMTaskManager({ csmFilter = 'all' }) {
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['csm-tasks'],
    queryFn: () => base44.entities.CSMTask.list('-due_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.CSMTask.update(id, {
        status: 'completed',
        completed_date: new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['csm-tasks'] }),
  });

  const filteredTasks = tasks.filter((t) => csmFilter === 'all' || t.csm_assigned === csmFilter);

  const priorityColor = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
  };

  const openTasks = filteredTasks.filter((t) => t.status !== 'completed').length;
  const overdueTasks = filteredTasks.filter(
    (t) => t.status !== 'completed' && new Date(t.due_date) < new Date()
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{openTasks}</p>
            <p className="text-xs text-gray-500">Open Tasks</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {filteredTasks
          .filter((t) => t.status !== 'completed')
          .map((task) => {
            const contact = contacts.find((c) => c.id === task.contact_id);
            const isOverdue = new Date(task.due_date) < new Date();

            return (
              <Card key={task.id} className={`glass-card ${isOverdue ? 'border-red-300' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {isOverdue && <AlertCircle className="w-5 h-5 text-red-500" />}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {contact?.first_name} {contact?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColor[task.priority]}>{task.priority}</Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => completeTaskMutation.mutate(task.id)}
                    >
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
