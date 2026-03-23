import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';

export default function CreateReportModal({ open, onClose, onSave, websites, isLoading }) {
  const [form, setForm] = useState({
    name: '',
    website_id: '',
    schedule: 'manual',
    recipients: [],
    include_traffic: true,
    include_rankings: true,
    include_backlinks: true,
    include_trends: true,
  });
  const [emailInput, setEmailInput] = useState('');

  const handleSave = () => {
    const nextRun =
      form.schedule === 'weekly'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : form.schedule === 'monthly'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null;

    onSave({
      ...form,
      next_run: nextRun,
      is_active: true,
    });
  };

  const addRecipient = () => {
    if (emailInput && emailInput.includes('@') && !form.recipients.includes(emailInput)) {
      setForm({ ...form, recipients: [...form.recipients, emailInput] });
      setEmailInput('');
    }
  };

  const removeRecipient = (email) => {
    setForm({ ...form, recipients: form.recipients.filter((r) => r !== email) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create SEO Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Report Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Monthly SEO Report"
            />
          </div>

          <div>
            <Label>Website</Label>
            <Select
              value={form.website_id}
              onValueChange={(v) => setForm({ ...form, website_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select website" />
              </SelectTrigger>
              <SelectContent>
                {websites.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Schedule</Label>
            <Select value={form.schedule} onValueChange={(v) => setForm({ ...form, schedule: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Only</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Email Recipients (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="email@example.com"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              />
              <Button type="button" variant="outline" onClick={addRecipient}>
                Add
              </Button>
            </div>
            {form.recipients.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeRecipient(email)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <Label>Include in Report</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Traffic</span>
                <Switch
                  checked={form.include_traffic}
                  onCheckedChange={(v) => setForm({ ...form, include_traffic: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rankings</span>
                <Switch
                  checked={form.include_rankings}
                  onCheckedChange={(v) => setForm({ ...form, include_rankings: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backlinks</span>
                <Switch
                  checked={form.include_backlinks}
                  onCheckedChange={(v) => setForm({ ...form, include_backlinks: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trends</span>
                <Switch
                  checked={form.include_trends}
                  onCheckedChange={(v) => setForm({ ...form, include_trends: v })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.website_id || isLoading}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
