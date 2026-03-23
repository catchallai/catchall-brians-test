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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Mail, Clock, Loader2 } from 'lucide-react';

export default function DripCampaignModal({
  open,
  onClose,
  dripCampaign,
  templates,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'manual',
    trigger_value: '',
    emails: [],
    status: 'draft',
  });

  useEffect(() => {
    if (dripCampaign) {
      setFormData({
        name: dripCampaign.name || '',
        trigger_type: dripCampaign.trigger_type || 'manual',
        trigger_value: dripCampaign.trigger_value || '',
        emails: dripCampaign.emails || [],
        status: dripCampaign.status || 'draft',
      });
    } else {
      setFormData({
        name: '',
        trigger_type: 'manual',
        trigger_value: '',
        emails: [],
        status: 'draft',
      });
    }
  }, [dripCampaign, open]);

  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, { delay_days: 0, subject: '', body: '', template_id: '' }],
    });
  };

  const updateEmail = (index, field, value) => {
    const newEmails = [...formData.emails];
    newEmails[index] = { ...newEmails[index], [field]: value };
    setFormData({ ...formData, emails: newEmails });
  };

  const removeEmail = (index) => {
    setFormData({
      ...formData,
      emails: formData.emails.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dripCampaign ? 'Edit' : 'Create'} Drip Campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Welcome Series"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Enrollment</SelectItem>
                    <SelectItem value="contact_status_change">Contact Status Change</SelectItem>
                    <SelectItem value="deal_stage_change">Deal Stage Change</SelectItem>
                    <SelectItem value="form_submission">Form Submission</SelectItem>
                    <SelectItem value="tag_added">Tag Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger_type !== 'manual' && (
                <div>
                  <Label>Trigger Value</Label>
                  <Input
                    value={formData.trigger_value}
                    onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                    placeholder="e.g., status=lead"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Email Sequence</Label>
              <Button
                type="button"
                onClick={addEmail}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Email
              </Button>
            </div>

            {formData.emails.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-4">No emails in sequence yet</p>
                  <Button type="button" onClick={addEmail} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Email
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {formData.emails.map((email, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <Input
                              type="number"
                              value={email.delay_days}
                              onChange={(e) =>
                                updateEmail(index, 'delay_days', parseInt(e.target.value) || 0)
                              }
                              className="w-20"
                              min="0"
                            />
                            <span className="text-sm text-gray-500">
                              days after {index === 0 ? 'enrollment' : 'previous email'}
                            </span>
                          </div>

                          <div>
                            <Label className="text-xs">Template (optional)</Label>
                            <Select
                              value={email.template_id}
                              onValueChange={(value) => {
                                updateEmail(index, 'template_id', value);
                                const template = templates?.find((t) => t.id === value);
                                if (template) {
                                  updateEmail(index, 'subject', template.subject);
                                  updateEmail(index, 'body', template.body);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templates?.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Subject</Label>
                            <Input
                              value={email.subject}
                              onChange={(e) => updateEmail(index, 'subject', e.target.value)}
                              placeholder="Email subject"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Body</Label>
                            <Textarea
                              value={email.body}
                              onChange={(e) => updateEmail(index, 'body', e.target.value)}
                              placeholder="Email content (HTML supported)"
                              rows={4}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmail(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || formData.emails.length === 0}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Campaign'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
