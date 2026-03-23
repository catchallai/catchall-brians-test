import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Mail, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ScheduledReports({ reports = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [schedule, setSchedule] = useState({
    frequency: 'weekly',
    day: 'monday',
    time: '09:00',
    recipients: '',
  });
  const queryClient = useQueryClient();

  const { data: scheduledReports = [] } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: () => base44.entities.ScheduledTask.filter({ task_type: 'report' }),
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ScheduledTask.create({
        task_type: 'report',
        task_config: data,
        is_active: true,
        frequency: data.frequency,
        next_run: calculateNextRun(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setShowModal(false);
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ScheduledTask.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
  });

  const calculateNextRun = (config) => {
    const now = new Date();
    const [hour, minute] = config.time.split(':');
    const next = new Date(now);
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);

    if (config.frequency === 'daily' && next <= now) {
      next.setDate(next.getDate() + 1);
    } else if (config.frequency === 'weekly') {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(config.day);
      const currentDay = next.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntil);
    } else if (config.frequency === 'monthly') {
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      next.setDate(1);
    }

    return next.toISOString();
  };

  const handleCreateSchedule = () => {
    const reportToSchedule = reports.find((r) => r.id === selectedReport);
    if (!reportToSchedule) {
      return;
    }

    createScheduleMutation.mutate({
      report_id: selectedReport,
      report_name: reportToSchedule.name,
      ...schedule,
      recipients: schedule.recipients.split(',').map((e) => e.trim()),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Scheduled Reports
            </CardTitle>
            <Button size="sm" onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No scheduled reports yet</p>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{schedule.task_config?.report_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {schedule.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {schedule.task_config?.recipients?.length || 0} recipients
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(checked) =>
                        toggleScheduleMutation.mutate({ id: schedule.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Report</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frequency</Label>
              <Select
                value={schedule.frequency}
                onValueChange={(val) => setSchedule({ ...schedule, frequency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {schedule.frequency === 'weekly' && (
              <div>
                <Label>Day of Week</Label>
                <Select
                  value={schedule.day}
                  onValueChange={(val) => setSchedule({ ...schedule, day: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
              />
            </div>

            <div>
              <Label>Recipients (comma-separated emails)</Label>
              <Input
                value={schedule.recipients}
                onChange={(e) => setSchedule({ ...schedule, recipients: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule} disabled={!selectedReport}>
                Schedule Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
