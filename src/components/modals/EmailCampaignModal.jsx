import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function EmailCampaignModal({
  open,
  onClose,
  emailCampaign,
  templates,
  campaigns,
  contacts,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    campaign_id: '',
    contact_ids: [],
    status: 'draft',
  });

  useEffect(() => {
    if (emailCampaign) {
      setFormData({
        name: emailCampaign.name || '',
        template_id: emailCampaign.template_id || '',
        campaign_id: emailCampaign.campaign_id || '',
        contact_ids: emailCampaign.contact_ids || [],
        status: emailCampaign.status || 'draft',
      });
    } else {
      setFormData({
        name: '',
        template_id: '',
        campaign_id: '',
        contact_ids: [],
        status: 'draft',
      });
    }
  }, [emailCampaign, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleContact = (contactId) => {
    setFormData((prev) => ({
      ...prev,
      contact_ids: prev.contact_ids.includes(contactId)
        ? prev.contact_ids.filter((id) => id !== contactId)
        : [...prev.contact_ids, contactId],
    }));
  };

  const selectAllContacts = () => {
    setFormData((prev) => ({
      ...prev,
      contact_ids: contacts.map((c) => c.id),
    }));
  };

  const clearAllContacts = () => {
    setFormData((prev) => ({ ...prev, contact_ids: [] }));
  };

  const contactsByStatus = {
    lead: contacts.filter((c) => c.status === 'lead'),
    prospect: contacts.filter((c) => c.status === 'prospect'),
    customer: contacts.filter((c) => c.status === 'customer'),
  };

  const selectByStatus = (status) => {
    const statusContacts = contactsByStatus[status]?.map((c) => c.id) || [];
    setFormData((prev) => ({
      ...prev,
      contact_ids: [...new Set([...prev.contact_ids, ...statusContacts])],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {emailCampaign ? 'Edit Email Campaign' : 'Create Email Campaign'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="recipients">
                Recipients ({formData.contact_ids.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-1">
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., January Newsletter"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Template *</Label>
                  <Select
                    value={formData.template_id}
                    onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Link to Marketing Campaign (Optional)</Label>
                  <Select
                    value={formData.campaign_id || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, campaign_id: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No campaign</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="recipients" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllContacts}>
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearAllContacts}>
                      Clear
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Badge
                      className="cursor-pointer hover:bg-violet-200 bg-violet-100 text-violet-700 border-0"
                      onClick={() => selectByStatus('lead')}
                    >
                      + Leads ({contactsByStatus.lead.length})
                    </Badge>
                    <Badge
                      className="cursor-pointer hover:bg-amber-200 bg-amber-100 text-amber-700 border-0"
                      onClick={() => selectByStatus('prospect')}
                    >
                      + Prospects ({contactsByStatus.prospect.length})
                    </Badge>
                    <Badge
                      className="cursor-pointer hover:bg-emerald-200 bg-emerald-100 text-emerald-700 border-0"
                      onClick={() => selectByStatus('customer')}
                    >
                      + Customers ({contactsByStatus.customer.length})
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-3 max-h-72 overflow-y-auto space-y-2">
                  {contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`contact-${contact.id}`}
                          checked={formData.contact_ids.includes(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                        <label
                          htmlFor={`contact-${contact.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {contact.first_name} {contact.last_name}
                          <span className="text-gray-400 ml-1">({contact.email})</span>
                        </label>
                        <Badge className="text-xs bg-gray-100 text-gray-600 border-0">
                          {contact.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No contacts available</p>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.template_id}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {emailCampaign ? 'Update' : 'Create'} Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
