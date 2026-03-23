import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

export default function OpportunityModal({
  open,
  onClose,
  opportunity,
  onSave,
  isLoading,
  contacts,
}) {
  const [formData, setFormData] = useState({
    title: '',
    contact_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    stage: 'new_lead',
    source: '',
    value: 0,
    priority: 'medium',
    expected_close_date: '',
    notes: '',
  });

  useEffect(() => {
    if (opportunity) {
      setFormData(opportunity);
    } else {
      setFormData({
        title: '',
        contact_id: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        stage: 'new_lead',
        source: '',
        value: 0,
        priority: 'medium',
        expected_close_date: '',
        notes: '',
      });
    }
  }, [opportunity, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleContactChange = (contactId) => {
    const contact = contacts?.find((c) => c.id === contactId);
    if (contact) {
      setFormData({
        ...formData,
        contact_id: contactId,
        contact_name: `${contact.first_name} ${contact.last_name}`,
        contact_email: contact.email,
        contact_phone: contact.phone,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Edit Opportunity' : 'Add Opportunity'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Contact</Label>
              <Select value={formData.contact_id} onValueChange={handleContactChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} - {contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Contact Phone</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div>
              <Label>Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="email_list">Email List</SelectItem>
                  <SelectItem value="media_inquiry">Media Inquiry</SelectItem>
                  <SelectItem value="reservation_request">Reservation Request</SelectItem>
                  <SelectItem value="no_response">No Response - Follow Up</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., Website, Referral, Event"
              />
            </div>

            <div>
              <Label>Value ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label>Expected Close Date</Label>
              <Input
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
