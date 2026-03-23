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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export default function CampaignModal({
  open,
  onClose,
  campaign,
  contacts,
  deals,
  keywords,
  backlinks,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    status: 'draft',
    start_date: '',
    end_date: '',
    budget: '',
    spent: '',
    goal: '',
    description: '',
    contact_ids: [],
    deal_ids: [],
    keyword_ids: [],
    backlink_ids: [],
    target_leads: '',
    target_revenue: '',
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        type: campaign.type || 'email',
        status: campaign.status || 'draft',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        budget: campaign.budget || '',
        spent: campaign.spent || '',
        goal: campaign.goal || '',
        description: campaign.description || '',
        contact_ids: campaign.contact_ids || [],
        deal_ids: campaign.deal_ids || [],
        keyword_ids: campaign.keyword_ids || [],
        backlink_ids: campaign.backlink_ids || [],
        target_leads: campaign.target_leads || '',
        target_revenue: campaign.target_revenue || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'email',
        status: 'draft',
        start_date: '',
        end_date: '',
        budget: '',
        spent: '',
        goal: '',
        description: '',
        contact_ids: [],
        deal_ids: [],
        keyword_ids: [],
        backlink_ids: [],
        target_leads: '',
        target_revenue: '',
      });
    }
  }, [campaign, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      spent: formData.spent ? parseFloat(formData.spent) : null,
      target_leads: formData.target_leads ? parseInt(formData.target_leads) : null,
      target_revenue: formData.target_revenue ? parseFloat(formData.target_revenue) : null,
    });
  };

  const toggleArrayItem = (field, id) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((i) => i !== id)
        : [...prev[field], id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="associations">CRM Links</TabsTrigger>
              <TabsTrigger value="seo">SEO Links</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-1">
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Q1 Email Outreach"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="social_media">📱 Social Media</SelectItem>
                        <SelectItem value="ppc">💰 PPC / Ads</SelectItem>
                        <SelectItem value="content">📝 Content</SelectItem>
                        <SelectItem value="seo">🔍 SEO</SelectItem>
                        <SelectItem value="event">🎪 Event</SelectItem>
                        <SelectItem value="referral">🤝 Referral</SelectItem>
                        <SelectItem value="other">📌 Other</SelectItem>
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spent">Spent ($)</Label>
                    <Input
                      id="spent"
                      type="number"
                      value={formData.spent}
                      onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_leads">Target Leads</Label>
                    <Input
                      id="target_leads"
                      type="number"
                      value={formData.target_leads}
                      onChange={(e) => setFormData({ ...formData, target_leads: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_revenue">Target Revenue ($)</Label>
                    <Input
                      id="target_revenue"
                      type="number"
                      value={formData.target_revenue}
                      onChange={(e) => setFormData({ ...formData, target_revenue: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Campaign Goal</Label>
                  <Input
                    id="goal"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="e.g., Generate 50 qualified leads"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="associations" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <Label>Link Contacts ({formData.contact_ids.length} selected)</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {contacts?.length > 0 ? (
                      contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`contact-${contact.id}`}
                            checked={formData.contact_ids.includes(contact.id)}
                            onCheckedChange={() => toggleArrayItem('contact_ids', contact.id)}
                          />
                          <label
                            htmlFor={`contact-${contact.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {contact.first_name} {contact.last_name}
                            <span className="text-gray-400 ml-1">({contact.email})</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No contacts available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Link Deals ({formData.deal_ids.length} selected)</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {deals?.length > 0 ? (
                      deals.map((deal) => (
                        <div key={deal.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`deal-${deal.id}`}
                            checked={formData.deal_ids.includes(deal.id)}
                            onCheckedChange={() => toggleArrayItem('deal_ids', deal.id)}
                          />
                          <label htmlFor={`deal-${deal.id}`} className="text-sm cursor-pointer">
                            {deal.title}
                            <span className="text-emerald-600 ml-1">
                              ${deal.value?.toLocaleString()}
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No deals available</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <Label>Link Keywords ({formData.keyword_ids.length} selected)</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {keywords?.length > 0 ? (
                      keywords.map((keyword) => (
                        <div key={keyword.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`keyword-${keyword.id}`}
                            checked={formData.keyword_ids.includes(keyword.id)}
                            onCheckedChange={() => toggleArrayItem('keyword_ids', keyword.id)}
                          />
                          <label
                            htmlFor={`keyword-${keyword.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {keyword.keyword}
                            {keyword.current_position && (
                              <span className="text-gray-400 ml-1">
                                (Position: {keyword.current_position})
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No keywords available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Link Backlinks ({formData.backlink_ids.length} selected)</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {backlinks?.length > 0 ? (
                      backlinks.map((backlink) => (
                        <div key={backlink.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`backlink-${backlink.id}`}
                            checked={formData.backlink_ids.includes(backlink.id)}
                            onCheckedChange={() => toggleArrayItem('backlink_ids', backlink.id)}
                          />
                          <label
                            htmlFor={`backlink-${backlink.id}`}
                            className="text-sm cursor-pointer truncate"
                          >
                            {backlink.source_domain}
                            <span className="text-gray-400 ml-1">
                              (DA: {backlink.domain_authority || '-'})
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No backlinks available</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
