import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function CallLoggerModal({
  open,
  onClose,
  call,
  contacts,
  deals,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    contact_id: '',
    deal_id: '',
    call_type: 'outbound',
    call_status: 'completed',
    duration_minutes: '',
    phone_number: '',
    call_date: new Date().toISOString().slice(0, 16),
    notes: '',
    next_action: '',
    sentiment: 'neutral',
    topics_discussed: [],
  });

  useEffect(() => {
    if (call) {
      setFormData({
        contact_id: call.contact_id || '',
        deal_id: call.deal_id || '',
        call_type: call.call_type || 'outbound',
        call_status: call.call_status || 'completed',
        duration_minutes: call.duration_minutes || '',
        phone_number: call.phone_number || '',
        call_date: call.call_date
          ? new Date(call.call_date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        notes: call.notes || '',
        next_action: call.next_action || '',
        sentiment: call.sentiment || 'neutral',
        topics_discussed: call.topics_discussed || [],
      });
    }
  }, [call]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      duration_minutes: formData.duration_minutes
        ? parseFloat(formData.duration_minutes)
        : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{call ? 'Edit Call' : 'Log Call'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deal (Optional)</Label>
              <Select
                value={formData.deal_id}
                onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Call Type</Label>
              <Select
                value={formData.call_type}
                onValueChange={(value) => setFormData({ ...formData, call_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Call Status</Label>
              <Select
                value={formData.call_status}
                onValueChange={(value) => setFormData({ ...formData, call_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Call Date & Time</Label>
            <Input
              type="datetime-local"
              value={formData.call_date}
              onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Sentiment</Label>
            <Select
              value={formData.sentiment}
              onValueChange={(value) => setFormData({ ...formData, sentiment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Call Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Summarize the call conversation..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Next Action</Label>
            <Input
              value={formData.next_action}
              onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
              placeholder="e.g., Follow up next week, Send proposal"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.contact_id || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {call ? 'Update Call' : 'Log Call'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
