import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, FileText, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProposalModal({
  open,
  onClose,
  proposal,
  contacts,
  deals,
  onSave,
  isLoading,
}) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    contact_id: '',
    deal_id: '',
    status: 'draft',
    total_value: 0,
    currency: 'USD',
    line_items: [],
    terms: '',
    notes: '',
    valid_until: '',
  });

  React.useEffect(() => {
    if (proposal) {
      setFormData(proposal);
    } else {
      setFormData({
        title: '',
        contact_id: '',
        deal_id: '',
        status: 'draft',
        total_value: 0,
        currency: 'USD',
        line_items: [],
        terms: '',
        notes: '',
        valid_until: '',
      });
    }
  }, [proposal, open]);

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...(formData.line_items || []),
        {
          name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
        },
      ],
    });
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    const total = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setFormData({ ...formData, line_items: newItems, total_value: total });
  };

  const removeLineItem = (index) => {
    const newItems = formData.line_items.filter((_, i) => i !== index);
    const total = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setFormData({ ...formData, line_items: newItems, total_value: total });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleViewPdf = async () => {
    if (!proposal?.id) {
      toast.error('Please save the proposal first');
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await base44.functions.invoke('generateProposalPdf', {
        proposalId: proposal.id,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('PDF generated successfully');
    } catch (_error) {
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleEmailProposal = async () => {
    if (!proposal?.id) {
      toast.error('Please save the proposal first');
      return;
    }

    setSendingEmail(true);
    try {
      await base44.functions.invoke('emailProposal', { proposalId: proposal.id });
      toast.success('Proposal sent successfully');
      onClose();
    } catch (_error) {
      toast.error('Failed to send proposal');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proposal ? 'Edit Proposal' : 'Create Proposal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Proposal title"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Contact *</label>
              <Select
                value={formData.contact_id || undefined}
                onValueChange={(val) => setFormData({ ...formData, contact_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.length > 0 ? (
                    contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No contacts found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Deal (Optional)</label>
              <Select
                value={formData.deal_id || undefined}
                onValueChange={(val) => setFormData({ ...formData, deal_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {deals?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Valid Until</label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Line Items</h4>
              <Button type="button" onClick={addLineItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {formData.line_items?.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
                <div className="flex justify-between">
                  <span className="font-medium">Item {index + 1}</span>
                  <Button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm">Name</label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                    />
                  </div>
                  <div>
                    <label className="text-sm">Quantity</label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(index, 'quantity', parseFloat(e.target.value))
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm">Unit Price</label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateLineItem(index, 'unit_price', parseFloat(e.target.value))
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm">Description</label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="text-right font-medium">Total: ${(item.total || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <div className="text-right">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Value:</span>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                ${formData.total_value?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Terms & Conditions</label>
            <Textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3}
              placeholder="Payment terms, delivery, etc."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Internal Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes (not visible to client)"
            />
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              {proposal?.id && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleViewPdf}
                    disabled={generatingPdf}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {generatingPdf ? 'Generating...' : 'View PDF'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEmailProposal}
                    disabled={sendingEmail}
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {sendingEmail ? 'Sending...' : 'Email to Client'}
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !formData.title || !formData.contact_id}>
                {proposal ? 'Update' : 'Create'} Proposal
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
