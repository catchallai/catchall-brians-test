import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Mail, Play, Pause, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
};

const TRIGGER_LABELS = {
  contact_status_change: 'Contact Status Change',
  deal_stage_change: 'Deal Stage Change',
  form_submission: 'Form Submission',
  tag_added: 'Tag Added',
  manual: 'Manual Enrollment',
};

export default function DripCampaignsPanel({ campaigns }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'contact_status_change',
    trigger_value: 'lead',
    emails: [{ delay_days: 0, subject: '', body: '' }],
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailDripCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drip-campaigns'] });
      setShowModal(false);
      toast.success('Campaign created');
      setFormData({
        name: '',
        trigger_type: 'contact_status_change',
        trigger_value: 'lead',
        emails: [{ delay_days: 0, subject: '', body: '' }],
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EmailDripCampaign.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drip-campaigns'] });
      toast.success('Campaign updated');
    },
  });

  const addEmailStep = () => {
    const lastDelay = formData.emails[formData.emails.length - 1]?.delay_days || 0;
    setFormData((prev) => ({
      ...prev,
      emails: [...prev.emails, { delay_days: lastDelay + 3, subject: '', body: '' }],
    }));
  };

  const updateEmailStep = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    }));
  };

  const removeEmailStep = (index) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Email Drip Campaigns
          </h2>
          <p className="text-sm text-gray-500">Automated email sequences triggered by actions</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card className="glass-card rounded-2xl">
            <CardContent className="py-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Drip Campaigns
              </h3>
              <p className="text-gray-500 mb-4">Create automated email sequences</p>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {campaign.name}
                      </h3>
                      <Badge className={STATUS_COLORS[campaign.status]}>{campaign.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Trigger: {TRIGGER_LABELS[campaign.trigger_type]} = {campaign.trigger_value}
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {campaign.emails?.length || 0} emails
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {campaign.enrolled_count || 0} enrolled
                      </span>
                      <span className="text-emerald-600">{campaign.open_rate || 0}% open rate</span>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Drip Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., New Lead Nurture"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, trigger_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trigger Value</Label>
                <Input
                  value={formData.trigger_value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, trigger_value: e.target.value }))
                  }
                  placeholder="e.g., lead, proposal"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Email Sequence</Label>
                <Button variant="outline" size="sm" onClick={addEmailStep}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Email
                </Button>
              </div>

              {formData.emails.map((email, idx) => (
                <Card key={idx} className="bg-gray-50 dark:bg-gray-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Email {idx + 1}</Badge>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Delay (days):</Label>
                        <Input
                          type="number"
                          className="w-16 h-8"
                          value={email.delay_days}
                          onChange={(e) =>
                            updateEmailStep(idx, 'delay_days', parseInt(e.target.value))
                          }
                        />
                        {idx > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => removeEmailStep(idx)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input
                      placeholder="Subject line"
                      value={email.subject}
                      onChange={(e) => updateEmailStep(idx, 'subject', e.target.value)}
                    />
                    <Textarea
                      placeholder="Email body"
                      rows={3}
                      value={email.body}
                      onChange={(e) => updateEmailStep(idx, 'body', e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
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
