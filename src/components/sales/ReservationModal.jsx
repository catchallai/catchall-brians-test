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

export default function ReservationModal({
  open,
  onClose,
  reservation,
  contacts,
  deals,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    contact_id: '',
    deal_id: '',
    reservation_type: 'product',
    title: '',
    description: '',
    reservation_date: new Date().toISOString().slice(0, 16),
    expiry_date: '',
    status: 'pending',
    value: '',
    quantity: '1',
    product_service: '',
    payment_status: 'unpaid',
    deposit_amount: '',
    notes: '',
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        contact_id: reservation.contact_id || '',
        deal_id: reservation.deal_id || '',
        reservation_type: reservation.reservation_type || 'product',
        title: reservation.title || '',
        description: reservation.description || '',
        reservation_date: reservation.reservation_date
          ? new Date(reservation.reservation_date).toISOString().slice(0, 16)
          : '',
        expiry_date: reservation.expiry_date
          ? new Date(reservation.expiry_date).toISOString().slice(0, 16)
          : '',
        status: reservation.status || 'pending',
        value: reservation.value || '',
        quantity: reservation.quantity || '1',
        product_service: reservation.product_service || '',
        payment_status: reservation.payment_status || 'unpaid',
        deposit_amount: reservation.deposit_amount || '',
        notes: reservation.notes || '',
      });
    }
  }, [reservation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined,
      quantity: formData.quantity ? parseInt(formData.quantity) : 1,
      deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reservation ? 'Edit Reservation' : 'New Reservation'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deal (Optional)</Label>
              <Select
                value={formData.deal_id}
                onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Product Demo Reservation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.reservation_type}
                onValueChange={(value) => setFormData({ ...formData, reservation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product/Service</Label>
            <Input
              value={formData.product_service}
              onChange={(e) => setFormData({ ...formData, product_service: e.target.value })}
              placeholder="What is being reserved?"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.payment_status === 'deposit_paid' && (
            <div className="space-y-2">
              <Label>Deposit Amount</Label>
              <Input
                type="number"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reservation Date *</Label>
              <Input
                type="datetime-local"
                value={formData.reservation_date}
                onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="datetime-local"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.contact_id || !formData.title || isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reservation ? 'Update' : 'Create'} Reservation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
