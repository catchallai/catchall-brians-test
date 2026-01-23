import React, { useState, useEffect } from 'react';
import DataRoomDocumentPicker from './DataRoomDocumentPicker';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Trash2 } from 'lucide-react';

export default function DataRoomModal({ open, onClose, onSave, dataRoom }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recipient_name: '',
    recipient_email: '',
    contact_id: '',
    document_ids: [],
    access_password: '',
    expires_at: '',
    allow_downloads: true,
    watermark_text: '',
    notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['tracked-documents'],
    queryFn: () => base44.entities.TrackedDocument.filter(
      { business_id: user?.business_id },
      '-created_date'
    ),
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.filter(
      { business_id: user?.business_id },
      '-created_date',
      100
    ),
    enabled: !!user,
  });

  useEffect(() => {
    if (dataRoom) {
      setFormData({
        name: dataRoom.name || '',
        description: dataRoom.description || '',
        recipient_name: dataRoom.recipient_name || '',
        recipient_email: dataRoom.recipient_email || '',
        contact_id: dataRoom.contact_id || '',
        document_ids: dataRoom.document_ids || [],
        access_password: dataRoom.access_password || '',
        expires_at: dataRoom.expires_at ? dataRoom.expires_at.split('T')[0] : '',
        allow_downloads: dataRoom.allow_downloads !== false,
        watermark_text: dataRoom.watermark_text || '',
        notes: dataRoom.notes || ''
      });
    } else {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        expires_at: defaultExpiry.toISOString().split('T')[0]
      }));
    }
  }, [dataRoom]);

  const handleContactChange = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setFormData(prev => ({
        ...prev,
        contact_id: contactId,
        recipient_name: `${contact.first_name} ${contact.last_name}`,
        recipient_email: contact.email
      }));
    }
  };

  const handleDocumentToggle = (docId) => {
    setFormData(prev => ({
      ...prev,
      document_ids: prev.document_ids.includes(docId)
        ? prev.document_ids.filter(id => id !== docId)
        : [...prev.document_ids, docId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trackingCode = dataRoom?.tracking_code || `dr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareLink = `${window.location.origin}?page=PublicDataRoom&token=${trackingCode}`;
    
    onSave({
      ...formData,
      tracking_code: trackingCode,
      share_link: shareLink,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dataRoom ? 'Edit Data Room' : 'Create Data Room'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Select Contact</Label>
              <Select value={formData.contact_id} onValueChange={handleContactChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Recipient Name *</Label>
              <Input
                value={formData.recipient_name}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Recipient Email *</Label>
            <Input
              type="email"
              value={formData.recipient_email}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Documents *</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents available</p>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.document_ids.includes(doc.id)}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Access Password (optional)</Label>
              <Input
                type="password"
                value={formData.access_password}
                onChange={(e) => setFormData(prev => ({ ...prev, access_password: e.target.value }))}
                placeholder="Leave empty for no password"
              />
            </div>

            <div>
              <Label>Expires At *</Label>
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Watermark Text (optional)</Label>
            <Input
              value={formData.watermark_text}
              onChange={(e) => setFormData(prev => ({ ...prev, watermark_text: e.target.value }))}
              placeholder="e.g., Confidential - For recipient_name"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.allow_downloads}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_downloads: checked }))}
            />
            <Label>Allow downloads</Label>
          </div>

          <div>
            <Label>Internal Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {dataRoom ? 'Update' : 'Create'} Data Room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}