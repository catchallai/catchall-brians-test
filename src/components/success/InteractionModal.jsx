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

export default function InteractionModal({
  open,
  onClose,
  interaction,
  contacts,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    contact_id: '',
    interaction_type: 'check_in',
    interaction_date: new Date().toISOString().slice(0, 16),
    duration_minutes: '',
    sentiment: 'neutral',
    summary: '',
    csm_name: '',
    next_touchpoint: '',
  });

  useEffect(() => {
    if (interaction) {
      setFormData({
        contact_id: interaction.contact_id || '',
        interaction_type: interaction.interaction_type || 'check_in',
        interaction_date: interaction.interaction_date
          ? new Date(interaction.interaction_date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        duration_minutes: interaction.duration_minutes || '',
        sentiment: interaction.sentiment || 'neutral',
        summary: interaction.summary || '',
        csm_name: interaction.csm_name || '',
        next_touchpoint: interaction.next_touchpoint
          ? new Date(interaction.next_touchpoint).toISOString().slice(0, 10)
          : '',
      });
    } else {
      setFormData({
        contact_id: '',
        interaction_type: 'check_in',
        interaction_date: new Date().toISOString().slice(0, 16),
        duration_minutes: '',
        sentiment: 'neutral',
        summary: '',
        csm_name: '',
        next_touchpoint: '',
      });
    }
  }, [interaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{interaction ? 'Edit' : 'Log'} Interaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} - {contact.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Interaction Type *</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check_in">Check-in</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="qbr">QBR</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="renewal">Renewal Discussion</SelectItem>
                  <SelectItem value="expansion">Expansion Talk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.interaction_date}
                onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sentiment *</Label>
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
              <Label>CSM Name</Label>
              <Input
                value={formData.csm_name}
                onChange={(e) => setFormData({ ...formData, csm_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Discussed product usage and upcoming features..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Next Touchpoint</Label>
            <Input
              type="date"
              value={formData.next_touchpoint}
              onChange={(e) => setFormData({ ...formData, next_touchpoint: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.contact_id || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {interaction ? 'Update' : 'Create'} Interaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
