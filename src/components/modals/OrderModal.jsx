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
import { Plus, Trash2 } from 'lucide-react';

export default function OrderModal({ open, onClose, onSave, order, isLoading }) {
  const [formData, setFormData] = useState({
    order_number: '',
    order_name: '',
    contact_id: '',
    company_id: '',
    deal_id: '',
    status: 'pending',
    order_date: new Date().toISOString().split('T')[0],
    total_amount: 0,
    subtotal: 0,
    tax_amount: 0,
    shipping_amount: 0,
    discount_amount: 0,
    currency: 'USD',
    line_items: [],
    payment_method: '',
    payment_status: 'pending',
    tracking_number: '',
    carrier: '',
    notes: '',
  });

  useEffect(() => {
    if (order) {
      setFormData(order);
    } else {
      setFormData({
        order_number: `ORD-${Date.now()}`,
        order_name: '',
        contact_id: '',
        company_id: '',
        deal_id: '',
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        subtotal: 0,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        currency: 'USD',
        line_items: [],
        payment_method: '',
        payment_status: 'pending',
        tracking_number: '',
        carrier: '',
        notes: '',
      });
    }
  }, [order, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [
        ...(prev.line_items || []),
        { product_name: '', quantity: 1, unit_price: 0, total: 0, sku: '' },
      ],
    }));
  };

  const removeLineItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...(formData.line_items || [])];
    newLineItems[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : newLineItems[index].quantity;
      const unitPrice =
        field === 'unit_price' ? parseFloat(value) || 0 : newLineItems[index].unit_price;
      newLineItems[index].total = quantity * unitPrice;
    }

    setFormData((prev) => ({ ...prev, line_items: newLineItems }));
    calculateTotals(newLineItems);
  };

  const calculateTotals = (lineItems) => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const total =
      subtotal +
      (formData.tax_amount || 0) +
      (formData.shipping_amount || 0) -
      (formData.discount_amount || 0);
    setFormData((prev) => ({
      ...prev,
      subtotal,
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
          <DialogTitle>{order ? 'Edit Order' : 'New Order'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_number">Order Number *</Label>
                  <Input
                    id="order_number"
                    value={formData.order_number}
                    onChange={(e) => handleChange('order_number', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_name">Order Name</Label>
                  <Input
                    id="order_name"
                    value={formData.order_name}
                    onChange={(e) => handleChange('order_name', e.target.value)}
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) => handleChange('payment_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => handleChange('order_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Input
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => handleChange('payment_method', e.target.value)}
                    placeholder="e.g., Credit Card, PayPal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-4">
              {(formData.line_items || []).map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Product name"
                      value={item.product_name}
                      onChange={(e) => handleLineItemChange(index, 'product_name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Unit price"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                      step="0.01"
                    />
                    <Input
                      placeholder="Total"
                      value={item.total?.toFixed(2) || '0.00'}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </Button>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${formData.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="flex-1">Tax:</Label>
                  <Input
                    type="number"
                    value={formData.tax_amount}
                    onChange={(e) => {
                      handleChange('tax_amount', parseFloat(e.target.value) || 0);
                      calculateTotals(formData.line_items || []);
                    }}
                    className="w-32"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="flex-1">Shipping:</Label>
                  <Input
                    type="number"
                    value={formData.shipping_amount}
                    onChange={(e) => {
                      handleChange('shipping_amount', parseFloat(e.target.value) || 0);
                      calculateTotals(formData.line_items || []);
                    }}
                    className="w-32"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="flex-1">Discount:</Label>
                  <Input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => {
                      handleChange('discount_amount', parseFloat(e.target.value) || 0);
                      calculateTotals(formData.line_items || []);
                    }}
                    className="w-32"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${formData.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => handleChange('tracking_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    value={formData.carrier}
                    onChange={(e) => handleChange('carrier', e.target.value)}
                    placeholder="e.g., FedEx, UPS, USPS"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : order ? 'Update' : 'Create'} Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
