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

export default function PostalMailModal({ open, onClose, onSave, mail, isLoading }) {
  const [formData, setFormData] = useState({
    subject: '',
    mail_type: 'letter',
    direction: 'outbound',
    status: 'draft',
    contact_id: '',
    company_id: '',
    deal_id: '',
    recipient_name: '',
    recipient_address: {
      address_line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA',
    },
    sender_name: '',
    sender_address: {
      address_line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA',
    },
    content: '',
    sent_date: '',
    tracking_number: '',
    carrier: '',
    cost: 0,
    notes: '',
  });

  useEffect(() => {
    if (mail) {
      setFormData(mail);
    } else {
      setFormData({
        subject: '',
        mail_type: 'letter',
        direction: 'outbound',
        status: 'draft',
        contact_id: '',
        company_id: '',
        deal_id: '',
        recipient_name: '',
        recipient_address: {
          address_line1: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'USA',
        },
        sender_name: '',
        sender_address: {
          address_line1: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'USA',
        },
        content: '',
        sent_date: '',
        tracking_number: '',
        carrier: '',
        cost: 0,
        notes: '',
      });
    }
  }, [mail, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (addressType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mail ? 'Edit Postal Mail' : 'New Postal Mail'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mail_type">Type *</Label>
                  <Select
                    value={formData.mail_type}
                    onValueChange={(value) => handleChange('mail_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="postcard">Postcard</SelectItem>
                      <SelectItem value="package">Package</SelectItem>
                      <SelectItem value="catalog">Catalog</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="brochure">Brochure</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Direction</Label>
                  <Select
                    value={formData.direction}
                    onValueChange={(value) => handleChange('direction', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message/Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4 mt-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Recipient</h3>
                <Input
                  placeholder="Recipient name"
                  value={formData.recipient_name}
                  onChange={(e) => handleChange('recipient_name', e.target.value)}
                />
                <Input
                  placeholder="Address line 1"
                  value={formData.recipient_address?.address_line1 || ''}
                  onChange={(e) =>
                    handleAddressChange('recipient_address', 'address_line1', e.target.value)
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.recipient_address?.city || ''}
                    onChange={(e) =>
                      handleAddressChange('recipient_address', 'city', e.target.value)
                    }
                  />
                  <Input
                    placeholder="State"
                    value={formData.recipient_address?.state || ''}
                    onChange={(e) =>
                      handleAddressChange('recipient_address', 'state', e.target.value)
                    }
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.recipient_address?.postal_code || ''}
                    onChange={(e) =>
                      handleAddressChange('recipient_address', 'postal_code', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">Sender</h3>
                <Input
                  placeholder="Sender name"
                  value={formData.sender_name}
                  onChange={(e) => handleChange('sender_name', e.target.value)}
                />
                <Input
                  placeholder="Address line 1"
                  value={formData.sender_address?.address_line1 || ''}
                  onChange={(e) =>
                    handleAddressChange('sender_address', 'address_line1', e.target.value)
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.sender_address?.city || ''}
                    onChange={(e) => handleAddressChange('sender_address', 'city', e.target.value)}
                  />
                  <Input
                    placeholder="State"
                    value={formData.sender_address?.state || ''}
                    onChange={(e) => handleAddressChange('sender_address', 'state', e.target.value)}
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.sender_address?.postal_code || ''}
                    onChange={(e) =>
                      handleAddressChange('sender_address', 'postal_code', e.target.value)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sent_date">Sent Date</Label>
                  <Input
                    id="sent_date"
                    type="date"
                    value={formData.sent_date}
                    onChange={(e) => handleChange('sent_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    value={formData.carrier}
                    onChange={(e) => handleChange('carrier', e.target.value)}
                    placeholder="USPS, FedEx, UPS..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => handleChange('tracking_number', e.target.value)}
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
              {isLoading ? 'Saving...' : mail ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
