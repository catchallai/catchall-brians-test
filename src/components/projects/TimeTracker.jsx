import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function TimeTracker({ taskId, timeLogs = [] }) {
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const logTimeMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TimeLog.create({
        task_id: taskId,
        user_email: user.email,
        hours: parseFloat(hours),
        date: new Date().toISOString().split('T')[0],
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] });
      setHours('');
      setDescription('');
    },
  });

  const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-violet-100 text-violet-800">{totalHours.toFixed(1)}h logged</Badge>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            step="0.5"
            placeholder="Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-24"
          />
          <Input
            placeholder="What did you work on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => logTimeMutation.mutate()}
            disabled={!hours || logTimeMutation.isPending}
            size="sm"
          >
            Log Time
          </Button>
        </div>

        {timeLogs.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {timeLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{log.hours}h</span>
                  <span className="text-gray-500 ml-2">{log.description}</span>
                </div>
                <span className="text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
