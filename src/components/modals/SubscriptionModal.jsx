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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export default function SubscriptionModal({ open, onClose, onSave, subscription, isLoading }) {
  const [formData, setFormData] = useState({
    subscription_name: '',
    status: 'active',
    billing_frequency: 'monthly',
    amount: 0,
    currency: 'USD',
    start_date: '',
    next_billing_date: '',
    trial_end_date: '',
    payment_method: '',
    auto_renewal: true,
    notes: '',
  });

  useEffect(() => {
    if (subscription) {
      setFormData(subscription);
    } else {
      setFormData({
        subscription_name: '',
        status: 'active',
        billing_frequency: 'monthly',
        amount: 0,
        currency: 'USD',
        start_date: '',
        next_billing_date: '',
        trial_end_date: '',
        payment_method: '',
        auto_renewal: true,
        notes: '',
      });
    }
  }, [subscription, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Calculate MRR and ARR
      if (field === 'amount' || field === 'billing_frequency') {
        const amount = field === 'amount' ? value : updated.amount;
        const frequency = field === 'billing_frequency' ? value : updated.billing_frequency;

        let mrr = 0;
        if (frequency === 'monthly') {
          mrr = amount;
        } else if (frequency === 'quarterly') {
          mrr = amount / 3;
        } else if (frequency === 'annually') {
          mrr = amount / 12;
        } else if (frequency === 'weekly') {
          mrr = amount * 4.33;
        }

        updated.mrr = mrr;
        updated.arr = mrr * 12;
      }

      return updated;
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
          <DialogTitle>{subscription ? 'Edit Subscription' : 'Create Subscription'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subscription_name">Subscription Name *</Label>
                <Input
                  id="subscription_name"
                  value={formData.subscription_name}
                  onChange={(e) => handleChange('subscription_name', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_frequency">Frequency *</Label>
                  <Select
                    value={formData.billing_frequency}
                    onValueChange={(value) => handleChange('billing_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="next_billing_date">Next Billing Date</Label>
                  <Input
                    id="next_billing_date"
                    type="date"
                    value={formData.next_billing_date}
                    onChange={(e) => handleChange('next_billing_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Input
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => handleChange('payment_method', e.target.value)}
                    placeholder="Credit card, ACH, etc."
                  />
                </div>
              </div>

              {formData.status === 'trial' && (
                <div className="space-y-2">
                  <Label htmlFor="trial_end_date">Trial End Date</Label>
                  <Input
                    id="trial_end_date"
                    type="date"
                    value={formData.trial_end_date}
                    onChange={(e) => handleChange('trial_end_date', e.target.value)}
                  />
                </div>
              )}

              {(formData.mrr > 0 || formData.arr > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">MRR</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      ${formData.mrr?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Monthly Recurring Revenue
                    </div>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg">
                    <div className="text-sm font-medium text-violet-900 dark:text-violet-100">
                      ARR
                    </div>
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      ${formData.arr?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-violet-600 dark:text-violet-400">
                      Annual Recurring Revenue
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label className="text-base">Auto-renewal</Label>
                  <p className="text-sm text-gray-500">Automatically renew this subscription</p>
                </div>
                <Switch
                  checked={formData.auto_renewal}
                  onCheckedChange={(checked) => handleChange('auto_renewal', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_link">Payment Link</Label>
                <Input
                  id="payment_link"
                  value={formData.payment_link}
                  onChange={(e) => handleChange('payment_link', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : subscription ? 'Update' : 'Create'} Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
