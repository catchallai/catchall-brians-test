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
import { Plus, Trash2 } from 'lucide-react';

export default function InvoiceModal({ open, onClose, onSave, invoice, deal, isLoading }) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    title: '',
    contact_id: '',
    company_id: '',
    total_amount: 0,
    currency: 'USD',
    status: 'draft',
    issued_date: new Date().toISOString().split('T')[0],
    due_date: '',
    items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
    notes: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else if (deal) {
      // Pre-fill from deal
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      setFormData({
        invoice_number: `INV-${Date.now()}`,
        title: deal.title || '',
        contact_id: deal.contact_id || '',
        company_id: deal.company_id || '',
        total_amount: deal.value || 0,
        currency: 'USD',
        status: 'draft',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        items: [
          {
            description: deal.description || deal.title || '',
            quantity: 1,
            unit_price: deal.value || 0,
            amount: deal.value || 0,
          },
        ],
        notes: '',
      });
    } else {
      // Reset for new invoice
      setFormData({
        invoice_number: `INV-${Date.now()}`,
        title: '',
        contact_id: '',
        company_id: '',
        total_amount: 0,
        currency: 'USD',
        status: 'draft',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: '',
        items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
        notes: '',
      });
    }
  }, [invoice, deal, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;

    // Calculate amount for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }

    // Calculate total
    const total = newItems.reduce((sum, item) => sum + item.amount, 0);

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      total_amount: total,
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }],
    }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const total = newItems.reduce((sum, item) => sum + item.amount, 0);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      total_amount: total,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Edit Invoice' : deal ? 'Create Invoice from Deal' : 'New Invoice'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Invoice title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Contact ID</Label>
              <Input
                id="contact_id"
                value={formData.contact_id}
                onChange={(e) => handleChange('contact_id', e.target.value)}
                placeholder="Contact ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_id">Company ID</Label>
              <Input
                id="company_id"
                value={formData.company_id}
                onChange={(e) => handleChange('company_id', e.target.value)}
                placeholder="Company ID (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_date">Issued Date</Label>
              <Input
                id="issued_date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => handleChange('issued_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Line Items</Label>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-28">
                    <Input value={`$${item.amount.toFixed(2)}`} disabled className="bg-gray-50" />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${formData.total_amount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Payment terms and additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
