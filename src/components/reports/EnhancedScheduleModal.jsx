import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_OPTIONS = ['first', 'second', 'third', 'fourth', 'last'];

export default function EnhancedScheduleModal({ report, open, onClose }) {
  const [schedule, setSchedule] = useState({
    recurrence_type: 'weekly',
    recurrence_pattern: { days_of_week: [1] }, // Default Monday
    delivery_time: '09:00',
    timezone: 'America/Phoenix',
    recipients: [],
    is_active: true,
  });
  const [recipientEmail, setRecipientEmail] = useState('');
  const queryClient = useQueryClient();

  const createScheduleMutation = useMutation({
    mutationFn: async (data) => {
      const scheduleData = {
        ...data,
        report_id: report.id,
        start_date: new Date().toISOString().split('T')[0],
      };

      await base44.entities.ReportSchedule.create(scheduleData);

      // Create audit log
      await base44.entities.ReportAuditLog.create({
        report_id: report.id,
        action: 'scheduled',
        user_email: (await base44.auth.me()).email,
        details: {
          schedule: scheduleData,
          timestamp: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      onClose();
    },
  });

  const handleAddRecipient = () => {
    if (recipientEmail && !schedule.recipients.includes(recipientEmail)) {
      setSchedule({
        ...schedule,
        recipients: [...schedule.recipients, recipientEmail],
      });
      setRecipientEmail('');
    }
  };

  const handleRemoveRecipient = (email) => {
    setSchedule({
      ...schedule,
      recipients: schedule.recipients.filter((r) => r !== email),
    });
  };

  const toggleDay = (dayIndex) => {
    const days = schedule.recurrence_pattern.days_of_week || [];
    const newDays = days.includes(dayIndex)
      ? days.filter((d) => d !== dayIndex)
      : [...days, dayIndex];

    setSchedule({
      ...schedule,
      recurrence_pattern: { ...schedule.recurrence_pattern, days_of_week: newDays },
    });
  };

  const handleSave = () => {
    if (schedule.recipients.length === 0) {
      toast.warning('Please add at least one recipient');
      return;
    }
    createScheduleMutation.mutate(schedule);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Report - {report?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recurrence Type */}
          <div>
            <Label>Recurrence</Label>
            <Select
              value={schedule.recurrence_type}
              onValueChange={(value) => setSchedule({ ...schedule, recurrence_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekly Pattern */}
          {schedule.recurrence_type === 'weekly' && (
            <div>
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map((day, idx) => (
                  <Badge
                    key={idx}
                    variant={
                      (schedule.recurrence_pattern.days_of_week || []).includes(idx)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleDay(idx)}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Pattern */}
          {schedule.recurrence_type === 'monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Week of Month</Label>
                <Select
                  value={schedule.recurrence_pattern.week_of_month}
                  onValueChange={(value) =>
                    setSchedule({
                      ...schedule,
                      recurrence_pattern: { ...schedule.recurrence_pattern, week_of_month: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_OPTIONS.map((week) => (
                      <SelectItem key={week} value={week}>
                        {week} week
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Day of Week</Label>
                <Select
                  value={(schedule.recurrence_pattern.days_of_week?.[0] || 1).toString()}
                  onValueChange={(value) =>
                    setSchedule({
                      ...schedule,
                      recurrence_pattern: {
                        ...schedule.recurrence_pattern,
                        days_of_week: [parseInt(value)],
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Custom Pattern */}
          {schedule.recurrence_type === 'custom' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Custom patterns allow you to combine multiple days or create complex schedules.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Label>Select Days</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS.map((day, idx) => (
                    <Badge
                      key={idx}
                      variant={
                        (schedule.recurrence_pattern.days_of_week || []).includes(idx)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => toggleDay(idx)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delivery Time
              </Label>
              <Input
                type="time"
                value={schedule.delivery_time}
                onChange={(e) => setSchedule({ ...schedule, delivery_time: e.target.value })}
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select
                value={schedule.timezone}
                onValueChange={(value) => setSchedule({ ...schedule, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Phoenix">America/Phoenix</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End Date */}
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date (Optional)
            </Label>
            <Input
              type="date"
              value={schedule.end_date || ''}
              onChange={(e) => setSchedule({ ...schedule, end_date: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for ongoing schedule
            </p>
          </div>

          {/* Recipients */}
          <div>
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recipients
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@example.com"
                onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
              />
              <Button onClick={handleAddRecipient}>Add</Button>
            </div>
            {schedule.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {schedule.recipients.map((email, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveRecipient(email)}
                  >
                    {email} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createScheduleMutation.isPending || schedule.recipients.length === 0}
            >
              Create Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
