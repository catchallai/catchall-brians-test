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
import { Plus, X } from 'lucide-react';

export default function QuoteModal({ open, onClose, onSave, quote, isLoading }) {
  const [formData, setFormData] = useState({
    quote_name: '',
    quote_number: '',
    status: 'draft',
    signing_status: 'not_sent',
    contact_id: '',
    company_id: '',
    deal_id: '',
    total_amount: 0,
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    currency: 'USD',
    line_items: [],
    valid_until: '',
    notes: '',
    terms: '',
    payment_terms: 'Net 30',
  });

  useEffect(() => {
    if (quote) {
      setFormData(quote);
    } else {
      const quoteNumber = `Q-${Date.now()}`;
      setFormData({
        quote_name: '',
        quote_number: quoteNumber,
        status: 'draft',
        signing_status: 'not_sent',
        contact_id: '',
        company_id: '',
        deal_id: '',
        total_amount: 0,
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        currency: 'USD',
        line_items: [],
        valid_until: '',
        notes: '',
        terms: '',
        payment_terms: 'Net 30',
      });
    }
  }, [quote, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { product_name: '', quantity: 1, unit_price: 0, total: 0 }],
    }));
  };

  const removeLineItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    const subtotal = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const total = subtotal + formData.tax_amount - formData.discount_amount;

    setFormData((prev) => ({
      ...prev,
      line_items: newItems,
      subtotal,
      total_amount: total,
    }));
  };

  useEffect(() => {
    const subtotal = formData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total = subtotal + (formData.tax_amount || 0) - (formData.discount_amount || 0);
    if (subtotal !== formData.subtotal || total !== formData.total_amount) {
      setFormData((prev) => ({ ...prev, subtotal, total_amount: total }));
    }
  }, [formData.tax_amount, formData.discount_amount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quote ? 'Edit Quote' : 'Create Quote'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quote_name">Quote Name *</Label>
                  <Input
                    id="quote_name"
                    value={formData.quote_name}
                    onChange={(e) => handleChange('quote_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote_number">Quote Number</Label>
                  <Input
                    id="quote_number"
                    value={formData.quote_number}
                    onChange={(e) => handleChange('quote_number', e.target.value)}
                  />
                </div>
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_acceptance">Pending Acceptance</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signing_status">Signing Status</Label>
                  <Select
                    value={formData.signing_status}
                    onValueChange={(value) => handleChange('signing_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_sent">Not Sent</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => handleChange('valid_until', e.target.value)}
                />
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

            <TabsContent value="items" className="space-y-4 mt-4">
              <div className="space-y-3">
                {formData.line_items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="col-span-5">
                      <Label className="text-xs">Product/Service</Label>
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                        placeholder="Product name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Total</Label>
                      <Input value={item.total?.toFixed(2) || '0.00'} disabled />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLineItem}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Line Item
                </Button>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_amount">Tax Amount</Label>
                    <Input
                      id="tax_amount"
                      type="number"
                      value={formData.tax_amount}
                      onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        handleChange('discount_amount', parseFloat(e.target.value) || 0)
                      }
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      ${formData.total_amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => handleChange('payment_terms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms and Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleChange('terms', e.target.value)}
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : quote ? 'Update' : 'Create'} Quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
