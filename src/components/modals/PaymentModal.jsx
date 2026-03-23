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

export default function PaymentModal({
  open,
  onClose,
  payment,
  contacts,
  invoices,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    contact_id: '',
    invoice_id: '',
    amount: '',
    currency: 'USD',
    payment_method: 'credit_card',
    status: 'pending',
    transaction_id: '',
    reference_number: '',
    description: '',
    paid_by: '',
    paid_at: new Date().toISOString().split('T')[0],
    due_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (payment) {
      setFormData({
        contact_id: payment.contact_id || '',
        invoice_id: payment.invoice_id || '',
        amount: payment.amount || '',
        currency: payment.currency || 'USD',
        payment_method: payment.payment_method || 'credit_card',
        status: payment.status || 'pending',
        transaction_id: payment.transaction_id || '',
        reference_number: payment.reference_number || '',
        description: payment.description || '',
        paid_by: payment.paid_by || '',
        paid_at: payment.paid_at?.split('T')[0] || '',
        due_date: payment.due_date || '',
      });
    } else {
      setFormData({
        contact_id: '',
        invoice_id: '',
        amount: '',
        currency: 'USD',
        payment_method: 'credit_card',
        status: 'pending',
        transaction_id: '',
        reference_number: '',
        description: '',
        paid_by: '',
        paid_at: new Date().toISOString().split('T')[0],
        due_date: '',
      });
    }
  }, [payment, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.contact_id) {
      setErrors({ contact_id: 'Contact is required' });
      return;
    }
    if (!formData.amount) {
      setErrors({ amount: 'Amount is required' });
      return;
    }
    setErrors({});
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="contact_id">Contact/Customer *</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contact_id && <p className="text-xs text-red-500">{errors.contact_id}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_id">Invoice (Optional)</Label>
            <Select
              value={formData.invoice_id}
              onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {invoices?.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - ${invoice.total_amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                placeholder="0.00"
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_id">Transaction ID</Label>
            <Input
              id="transaction_id"
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              placeholder="External transaction ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_by">Paid By</Label>
            <Input
              id="paid_by"
              value={formData.paid_by}
              onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
              placeholder="Name of payer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_at">Payment Date</Label>
            <Input
              id="paid_at"
              type="date"
              value={formData.paid_at}
              onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Payment description/notes"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {payment ? 'Update' : 'Record'} Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
