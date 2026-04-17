import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, RefreshCw, Users, Play, Pause, Loader2, UserX, Target } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

const TARGET_LABELS = {
  inactive_contacts: 'Inactive Contacts',
  churned_customers: 'Churned Customers',
  stale_deals: 'Stale Deals',
  cold_leads: 'Cold Leads',
};

export default function ReEngagementPanel({ contacts, deals }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_type: 'inactive_contacts',
    inactivity_days: 30,
    email_subject: '',
    email_body: '',
    offer_type: 'none',
    offer_value: '',
  });
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['re-engagement-campaigns'],
    queryFn: () => base44.entities.ReEngagementCampaign.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReEngagementCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['re-engagement-campaigns'] });
      setShowModal(false);
      toast.success('Campaign created');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ReEngagementCampaign.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['re-engagement-campaigns'] });
    },
  });

  // Calculate segment sizes
  const now = new Date();
  const inactiveContacts = contacts.filter((c) => {
    const lastActivity = new Date(c.updated_date || c.created_date);
    return differenceInDays(now, lastActivity) > 30;
  }).length;

  const churnedCustomers = contacts.filter((c) => c.status === 'churned').length;

  const staleDeals = deals.filter((d) => {
    const lastUpdate = new Date(d.updated_date || d.created_date);
    return (
      differenceInDays(now, lastUpdate) > 14 &&
      d.stage !== 'closed_won' &&
      d.stage !== 'closed_lost'
    );
  }).length;

  const coldLeads = contacts.filter((c) => {
    const created = new Date(c.created_date);
    return c.status === 'lead' && differenceInDays(now, created) > 60;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Re-engagement Campaigns
          </h2>
          <p className="text-sm text-gray-500">Win back inactive contacts and churned customers</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Segment Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveContacts}</p>
            <p className="text-sm text-gray-500">Inactive (30+ days)</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <UserX className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{churnedCustomers}</p>
            <p className="text-sm text-gray-500">Churned Customers</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{staleDeals}</p>
            <p className="text-sm text-gray-500">Stale Deals</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{coldLeads}</p>
            <p className="text-sm text-gray-500">Cold Leads (60+ days)</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card className="glass-card rounded-2xl">
            <CardContent className="py-12 text-center">
              <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Re-engagement Campaigns
              </h3>
              <p className="text-gray-500 mb-4">Create campaigns to win back inactive users</p>
              <Button onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="glass-card rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {campaign.name}
                      </h3>
                      <Badge
                        className={
                          campaign.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : campaign.status === 'paused'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Target: {TARGET_LABELS[campaign.target_type]} ({campaign.inactivity_days}+
                      days inactive)
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>{campaign.sent_count || 0} sent</span>
                      <span className="text-emerald-600">
                        {campaign.reengaged_count || 0} re-engaged
                      </span>
                      {campaign.offer_type !== 'none' && (
                        <Badge variant="outline">
                          {campaign.offer_type}: {campaign.offer_value}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: campaign.id, status: 'paused' })
                        }
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: campaign.id, status: 'active' })
                        }
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Re-engagement Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Win Back Churned Q4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Segment</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, target_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TARGET_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inactivity Days</Label>
                <Input
                  type="number"
                  value={formData.inactivity_days}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, inactivity_days: parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input
                value={formData.email_subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email_subject: e.target.value }))
                }
                placeholder="We miss you!"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body</Label>
              <Textarea
                value={formData.email_body}
                onChange={(e) => setFormData((prev) => ({ ...prev, email_body: e.target.value }))}
                rows={4}
                placeholder="Write your re-engagement message..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Offer Type</Label>
                <Select
                  value={formData.offer_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, offer_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Offer</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                    <SelectItem value="consultation">Free Consultation</SelectItem>
                    <SelectItem value="content">Exclusive Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.offer_type !== 'none' && (
                <div className="space-y-2">
                  <Label>Offer Value</Label>
                  <Input
                    value={formData.offer_value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, offer_value: e.target.value }))
                    }
                    placeholder="e.g., 20% off"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.name}
                className="flex-1"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
