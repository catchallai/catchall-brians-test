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

export default function CommunicationModal({
  open,
  onClose,
  communication,
  contacts,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    contact_id: '',
    contact_email: '',
    communication_type: 'email',
    subject: '',
    body: '',
    direction: 'outbound',
    duration_minutes: '',
    status: 'pending',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (communication) {
      setFormData({
        contact_id: communication.contact_id || '',
        contact_email: communication.contact_email || '',
        communication_type: communication.communication_type || 'email',
        subject: communication.subject || '',
        body: communication.body || '',
        direction: communication.direction || 'outbound',
        duration_minutes: communication.duration_minutes || '',
        status: communication.status || 'pending',
        notes: communication.notes || '',
      });
    } else {
      setFormData({
        contact_id: '',
        contact_email: '',
        communication_type: 'email',
        subject: '',
        body: '',
        direction: 'outbound',
        duration_minutes: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [communication, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.contact_id && !formData.contact_email) {
      setErrors({ contact_id: 'Contact or email is required' });
      return;
    }
    setErrors({});
    onSave(formData);
  };

  const selectedContact = contacts?.find((c) => c.id === formData.contact_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{communication ? 'Edit Communication' : 'Log Communication'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="communication_type">Type *</Label>
              <Select
                value={formData.communication_type}
                onValueChange={(value) => setFormData({ ...formData, communication_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) => setFormData({ ...formData, direction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Contact</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => {
                const contact = contacts?.find((c) => c.id === value);
                setFormData({
                  ...formData,
                  contact_id: value,
                  contact_email: contact?.email || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contact_id && <p className="text-xs text-red-500">{errors.contact_id}</p>}
          </div>

          {selectedContact && (
            <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg text-sm">
              <p className="text-violet-900 dark:text-violet-100">
                {selectedContact.first_name} {selectedContact.last_name} · {selectedContact.email}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Communication subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Details</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Communication details"
              rows={4}
            />
          </div>

          {formData.communication_type === 'call' && (
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {communication ? 'Update' : 'Log'} Communication
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
