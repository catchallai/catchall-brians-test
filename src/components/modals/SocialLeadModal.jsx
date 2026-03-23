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
import { Loader2, UserPlus } from 'lucide-react';

const PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
];

const INTERACTION_TYPES = [
  { id: 'comment', label: 'Comment' },
  { id: 'like', label: 'Like' },
  { id: 'share', label: 'Share' },
  { id: 'mention', label: 'Mention' },
  { id: 'dm', label: 'Direct Message' },
  { id: 'follow', label: 'Follow' },
];

export default function SocialLeadModal({
  open,
  onClose,
  lead,
  contacts,
  companies,
  deals,
  onSave,
  onConvertToContact,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    platform: 'twitter',
    social_handle: '',
    profile_url: '',
    interaction_type: 'comment',
    interaction_content: '',
    contact_id: '',
    company_id: '',
    deal_id: '',
    status: 'new',
    notes: '',
    lead_score: 0,
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        platform: lead.platform || 'twitter',
        social_handle: lead.social_handle || '',
        profile_url: lead.profile_url || '',
        interaction_type: lead.interaction_type || 'comment',
        interaction_content: lead.interaction_content || '',
        contact_id: lead.contact_id || '',
        company_id: lead.company_id || '',
        deal_id: lead.deal_id || '',
        status: lead.status || 'new',
        notes: lead.notes || '',
        lead_score: lead.lead_score || 0,
      });
    } else {
      setFormData({
        platform: 'twitter',
        social_handle: '',
        profile_url: '',
        interaction_type: 'comment',
        interaction_content: '',
        contact_id: '',
        company_id: '',
        deal_id: '',
        status: 'new',
        notes: '',
        lead_score: 0,
      });
    }
  }, [lead, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Social Lead' : 'Add Social Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform *</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_handle">Social Handle *</Label>
              <Input
                id="social_handle"
                value={formData.social_handle}
                onChange={(e) => setFormData({ ...formData, social_handle: e.target.value })}
                placeholder="@username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_url">Profile URL</Label>
            <Input
              id="profile_url"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interaction_content">Interaction Content</Label>
            <Textarea
              id="interaction_content"
              value={formData.interaction_content}
              onChange={(e) => setFormData({ ...formData, interaction_content: e.target.value })}
              rows={2}
              placeholder="What did they say or do?"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Link to CRM</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={formData.contact_id}
                  onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {contacts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {companies?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Deal</Label>
              <Select
                value={formData.deal_id}
                onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {deals?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-between pt-4">
            {lead && !formData.contact_id && onConvertToContact && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onConvertToContact(lead)}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Convert to Contact
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lead ? 'Update Lead' : 'Add Lead'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
