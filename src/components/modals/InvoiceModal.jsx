import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function InvoiceModal({ open, onClose, invoice, contacts, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    contact_id: '',
    invoice_number: '',
    title: '',
    total_amount: '',
    currency: 'USD',
    status: 'draft',
    issued_date: new Date().toISOString().split('T')[0],
    due_date: '',
    items: [],
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (invoice) {
      setFormData({
        contact_id: invoice.contact_id || '',
        invoice_number: invoice.invoice_number || '',
        title: invoice.title || '',
        total_amount: invoice.total_amount || '',
        currency: invoice.currency || 'USD',
        status: invoice.status || 'draft',
        issued_date: invoice.issued_date || '',
        due_date: invoice.due_date || '',
        items: invoice.items || [],
        notes: invoice.notes || '',
      });
    } else {
      setFormData({
        contact_id: '',
        invoice_number: `INV-${Date.now()}`,
        title: '',
        total_amount: '',
        currency: 'USD',
        status: 'draft',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: '',
        items: [],
        notes: '',
      });
    }
  }, [invoice, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.contact_id) {
      setErrors({ contact_id: 'Contact is required' });
      return;
    }
    if (!formData.invoice_number) {
      setErrors({ invoice_number: 'Invoice number is required' });
      return;
    }
    if (!formData.total_amount) {
      setErrors({ total_amount: 'Amount is required' });
      return;
    }
    setErrors({});
    onSave(formData);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]
    });
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newItems[idx].amount = (newItems[idx].quantity || 0) * (newItems[idx].unit_price || 0);
    }
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className={errors.invoice_number ? 'border-red-500' : ''}
              />
              {errors.invoice_number && <p className="text-xs text-red-500">{errors.invoice_number}</p>}
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Invoice title/description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_date">Issued Date</Label>
              <Input
                id="issued_date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-2">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Qty"
                    type="number"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                  />
                  <Input
                    placeholder="Unit Price"
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Total"
                      type="number"
                      step="0.01"
                      value={item.amount}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(idx)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                placeholder="0.00"
                className={errors.total_amount ? 'border-red-500' : ''}
              />
              {errors.total_amount && <p className="text-xs text-red-500">{errors.total_amount}</p>}
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
            <Label htmlFor="notes">Notes/Terms</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment terms, thank you note, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}