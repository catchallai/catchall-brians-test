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

export default function NoteModal({ open, onClose, onSave, note, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    associated_with: 'general',
    contact_id: '',
    company_id: '',
    deal_id: '',
    tags: [],
    is_pinned: false,
  });

  useEffect(() => {
    if (note) {
      setFormData(note);
    } else {
      setFormData({
        title: '',
        content: '',
        associated_with: 'general',
        contact_id: '',
        company_id: '',
        deal_id: '',
        tags: [],
        is_pinned: false,
      });
    }
  }, [note, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      last_modified_date: new Date().toISOString(),
    };
    onSave(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Add a title to your note"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={6}
              placeholder="Write your note here..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="associated_with">Associated With</Label>
              <Select
                value={formData.associated_with}
                onValueChange={(value) => handleChange('associated_with', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.associated_with === 'contact' && (
              <div className="space-y-2">
                <Label htmlFor="contact_id">Contact ID</Label>
                <Input
                  id="contact_id"
                  value={formData.contact_id}
                  onChange={(e) => handleChange('contact_id', e.target.value)}
                  placeholder="Contact ID"
                />
              </div>
            )}

            {formData.associated_with === 'company' && (
              <div className="space-y-2">
                <Label htmlFor="company_id">Company ID</Label>
                <Input
                  id="company_id"
                  value={formData.company_id}
                  onChange={(e) => handleChange('company_id', e.target.value)}
                  placeholder="Company ID"
                />
              </div>
            )}

            {formData.associated_with === 'deal' && (
              <div className="space-y-2">
                <Label htmlFor="deal_id">Deal ID</Label>
                <Input
                  id="deal_id"
                  value={formData.deal_id}
                  onChange={(e) => handleChange('deal_id', e.target.value)}
                  placeholder="Deal ID"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : note ? 'Update' : 'Create'} Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
