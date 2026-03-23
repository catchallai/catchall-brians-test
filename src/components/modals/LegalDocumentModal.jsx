import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const TEMPLATES = {
  nda: {
    title: 'Non-Disclosure Agreement',
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into as of [DATE] by and between:

[YOUR_COMPANY_NAME] ("Disclosing Party")
and
[RECIPIENT_NAME] ("Receiving Party")

1. CONFIDENTIAL INFORMATION
The Receiving Party acknowledges that they may receive confidential and proprietary information from the Disclosing Party.

2. OBLIGATIONS
The Receiving Party agrees to:
- Maintain strict confidentiality of all information received
- Not disclose any confidential information to third parties
- Use the information only for authorized purposes

3. TERM
This Agreement shall remain in effect for a period of [TERM] from the date of signing.

4. SIGNATURE
By signing below, the Receiving Party acknowledges and agrees to the terms of this Agreement.

Signature: _____________________
Date: _____________________
Name: [RECIPIENT_NAME]`,
  },
  media_release: {
    title: 'Media Release Form',
    content: `MEDIA RELEASE FORM

I, [RECIPIENT_NAME], hereby grant [YOUR_COMPANY_NAME] permission to use my:
- Name
- Likeness
- Image
- Voice
- Performance

For the following purposes:
- Marketing and promotional materials
- Social media content
- Website content
- Video productions
- Photography

I understand that:
- I will not receive compensation for this use
- The materials may be used indefinitely
- [YOUR_COMPANY_NAME] owns all rights to the final content

I release [YOUR_COMPANY_NAME] from any claims related to the use of these materials.

Signature: _____________________
Date: _____________________
Name: [RECIPIENT_NAME]
Email: [RECIPIENT_EMAIL]`,
  },
  contractor_agreement: {
    title: 'Contractor Agreement',
    content: `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is made between [YOUR_COMPANY_NAME] ("Company") and [RECIPIENT_NAME] ("Contractor").

1. SERVICES
Contractor agrees to provide the following services:
[SERVICES_DESCRIPTION]

2. COMPENSATION
Payment terms: [PAYMENT_TERMS]

3. RELATIONSHIP
Contractor is an independent contractor, not an employee.

4. CONFIDENTIALITY
Contractor agrees to maintain confidentiality of all proprietary information.

5. TERM
This agreement begins on [START_DATE] and continues until [END_DATE] or completion of services.

Signature: _____________________
Date: _____________________
Contractor: [RECIPIENT_NAME]`,
  },
  location_release: {
    title: 'Location Release Form',
    content: `LOCATION RELEASE FORM

I, [RECIPIENT_NAME], grant [YOUR_COMPANY_NAME] permission to use the property located at:
[LOCATION_ADDRESS]

For the following purposes:
- Film/video production
- Photography
- Content creation

Permission granted for:
Date(s): [DATES]
Time(s): [TIMES]

I understand and agree that:
- [YOUR_COMPANY_NAME] may use the footage/images for commercial purposes
- I will be compensated as follows: [COMPENSATION]
- I release all claims related to the use of this location

Property Owner Signature: _____________________
Date: _____________________
Name: [RECIPIENT_NAME]`,
  },
  talent_release: {
    title: 'Talent Release Form',
    content: `TALENT RELEASE FORM

I, [RECIPIENT_NAME], hereby grant [YOUR_COMPANY_NAME] the right to use my:
- Performance
- Voice
- Likeness
- Name

For: [PROJECT_NAME]

I understand:
- Compensation: [COMPENSATION_DETAILS]
- Usage: [USAGE_RIGHTS]
- Term: [TERM]

I release [YOUR_COMPANY_NAME] from all liability related to this release.

Talent Signature: _____________________
Date: _____________________
Name: [RECIPIENT_NAME]
Date of Birth: _____________________
Email: [RECIPIENT_EMAIL]
Phone: [PHONE]`,
  },
  custom: {
    title: 'Custom Document',
    content: '[Enter your custom document content here]',
  },
};

export default function LegalDocumentModal({
  open,
  onClose,
  document,
  contacts,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    document_type: 'nda',
    title: '',
    description: '',
    content: '',
    recipient_name: '',
    recipient_email: '',
    contact_id: '',
    company_name: '',
    expires_date: '',
    notes: '',
  });

  useEffect(() => {
    if (document) {
      setFormData({
        document_type: document.document_type || 'nda',
        title: document.title || '',
        description: document.description || '',
        content: document.content || '',
        recipient_name: document.recipient_name || '',
        recipient_email: document.recipient_email || '',
        contact_id: document.contact_id || '',
        company_name: document.company_name || '',
        expires_date: document.expires_date || '',
        notes: document.notes || '',
      });
    } else if (open) {
      const template = TEMPLATES[formData.document_type];
      setFormData({
        document_type: 'nda',
        title: template.title,
        description: '',
        content: template.content,
        recipient_name: '',
        recipient_email: '',
        contact_id: '',
        company_name: '',
        expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [document, open]);

  const handleTypeChange = (type) => {
    const template = TEMPLATES[type];
    setFormData((prev) => ({
      ...prev,
      document_type: type,
      title: template.title,
      content: template.content,
    }));
  };

  const handleContactChange = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setFormData((prev) => ({
        ...prev,
        contact_id: contactId,
        recipient_name: `${contact.first_name} ${contact.last_name}`,
        recipient_email: contact.email,
        company_name: contact.company_name || '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'Create Legal Document'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Document Type</Label>
              <select
                value={formData.document_type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                disabled={!!document}
              >
                <option value="nda">NDA</option>
                <option value="media_release">Media Release</option>
                <option value="contractor_agreement">Contractor Agreement</option>
                <option value="location_release">Location Release</option>
                <option value="talent_release">Talent Release</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <Label>Select Contact (Optional)</Label>
              <select
                value={formData.contact_id}
                onChange={(e) => handleContactChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <option value="">-- Select Contact --</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the document"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recipient Name</Label>
              <Input
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name (Optional)</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={formData.expires_date}
                onChange={(e) => setFormData({ ...formData, expires_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Document Content</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use placeholders: [RECIPIENT_NAME], [RECIPIENT_EMAIL], [YOUR_COMPANY_NAME], [DATE]
            </p>
          </div>

          <div>
            <Label>Internal Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Internal notes (not visible to recipient)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {document ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
