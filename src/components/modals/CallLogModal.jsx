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
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CallLogModal({ open, onClose, onSuccess, isLogCall = false }) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [searchingCompanies, setSearchingCompanies] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    contact_id: '',
    company_id: '',
    phone: '',
    job_title: '',
    call_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    outcome: 'completed',
  });

  useEffect(() => {
    if (open) {
      loadContactsAndCompanies();
      setFormData({
        first_name: '',
        last_name: '',
        company_name: '',
        contact_id: '',
        company_id: '',
        phone: '',
        job_title: '',
        call_date: new Date().toISOString().split('T')[0],
        duration_minutes: '',
        notes: '',
        outcome: 'completed',
      });
    }
  }, [open]);

  const loadContactsAndCompanies = async () => {
    try {
      setSearchingContacts(true);
      setSearchingCompanies(true);
      const [contactsData, companiesData] = await Promise.all([
        base44.entities.Contact.list('-created_date', 500),
        base44.entities.Company.list('-created_date', 500),
      ]);
      setContacts(contactsData || []);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setSearchingContacts(false);
      setSearchingCompanies(false);
    }
  };

  const handleContactChange = (contactId) => {
    setFormData({ ...formData, contact_id: contactId });
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setFormData((prev) => ({
        ...prev,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        job_title: contact.job_title || '',
        company_name: contact.company_name || '',
      }));
    }
  };

  const handleCompanyChange = (companyId) => {
    setFormData({ ...formData, company_id: companyId });
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setFormData((prev) => ({
        ...prev,
        company_name: company.name || '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.company_name) {
      toast.error('Name and Company are required');
      return;
    }

    setLoading(true);
    try {
      let contactId = formData.contact_id;
      let companyId = formData.company_id;

      // Create or find company
      if (!companyId) {
        const existingCompany = companies.find(
          (c) => c.name.toLowerCase() === formData.company_name.toLowerCase()
        );
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const newCompany = await base44.entities.Company.create({
            name: formData.company_name,
          });
          companyId = newCompany.id;
        }
      }

      // Create or find contact
      if (!contactId) {
        const existingContact = contacts.find(
          (c) =>
            c.first_name.toLowerCase() === formData.first_name.toLowerCase() &&
            c.last_name.toLowerCase() === (formData.last_name || '').toLowerCase() &&
            c.company_name.toLowerCase() === formData.company_name.toLowerCase()
        );
        if (existingContact) {
          contactId = existingContact.id;
        } else {
          const newContact = await base44.entities.Contact.create({
            first_name: formData.first_name,
            last_name: formData.last_name || '',
            email: '', // Required field but can be empty for now
            phone: formData.phone || '',
            job_title: formData.job_title || '',
            company_name: formData.company_name,
            company_id: companyId,
          });
          contactId = newContact.id;
        }
      }

      // Create call record
      await base44.entities.SalesCall.create({
        contact_id: contactId,
        company_id: companyId,
        phone: formData.phone,
        job_title: formData.job_title,
        call_date: formData.call_date,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        notes: formData.notes,
        outcome: formData.outcome,
      });

      toast.success('Call logged successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to log call: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isLogCall ? 'Log Call' : 'New Call'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Known Contact (Optional)</Label>
            <Select value={formData.contact_id} onValueChange={handleContactChange}>
              <SelectTrigger disabled={searchingContacts}>
                <SelectValue
                  placeholder={searchingContacts ? 'Loading...' : 'Select a contact...'}
                />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company *</Label>
            <Select value={formData.company_id} onValueChange={handleCompanyChange}>
              <SelectTrigger disabled={searchingCompanies}>
                <SelectValue
                  placeholder={searchingCompanies ? 'Loading...' : 'Select a company...'}
                />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.company_id && (
              <Input
                placeholder="Or enter company name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Manager"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="call_date">Call Date</Label>
              <Input
                id="call_date"
                type="date"
                value={formData.call_date}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData({ ...formData, outcome: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="callback">Callback Needed</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Call details..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogCall ? 'Log Call' : 'Create Call'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
